import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  runTransaction,
  writeBatch,
  serverTimestamp,
  deleteField,
} from 'firebase/firestore'
import { db } from '../config/firebase.js'
import { sendLoanRequestEmail, sendPickupTokenEmail } from '../config/emailjs.js'

/*
 * Flujo de préstamos
 *
 * Libro (colección "libros"):
 *   estado: 'disponible' | 'recoleccion' | 'prestado' | 'devolucion'
 *   usuarioUid / prestamoId: mientras el libro está apartado o prestado
 *
 * Préstamo (colección "prestamos"): historial completo, base de las estadísticas
 *   estado: 'pendiente' -> 'recoleccion_pendiente' -> 'activo' -> 'devolucion_pendiente' -> 'devuelto'
 *           'pendiente' / 'recoleccion_pendiente' -> 'rechazado'
 *
 * Reglas de negocio:
 * 1. Un alumno puede tener máximo 3 solicitudes/préstamos vigentes.
 * 2. Un alumno solo puede tener 1 libro asignado a la vez (recoleccion_pendiente, activo, devolucion_pendiente).
 * 3. Al autorizar una solicitud, pasa a etapa de recolección con un token único (UTSC-XXXX) enviado al correo institucional.
 * 4. En ventanilla se exige token + credencial física UTSC para activar el préstamo.
 */

import { ESTADO_LIBRO, ESTADO_PRESTAMO, estadoLibro } from '../data/estados.js'

export const MAX_SOLICITUDES_POR_ALUMNO = 3

export { ESTADO_LIBRO, ESTADO_PRESTAMO, estadoLibro }

export function generarTokenRecoleccion() {
  const digitos = Math.floor(1000 + Math.random() * 9000)
  return `UTSC-${digitos}`
}

const ESTADOS_CON_EJEMPLAR = [
  ESTADO_PRESTAMO.RECOLECCION_PENDIENTE,
  ESTADO_PRESTAMO.ACTIVO,
  ESTADO_PRESTAMO.DEVOLUCION_PENDIENTE,
]

// ---------- Acciones del alumno ----------

export async function solicitarLibro(book, user) {
  if (estadoLibro(book) !== ESTADO_LIBRO.DISPONIBLE) {
    throw new Error('Este libro ya no está disponible.')
  }

  // Consultar solicitudes y préstamos del usuario actual
  const q = query(collection(db, 'prestamos'), where('uid', '==', user.uid))
  const misPrestamos = await getDocs(q)
  const misDocs = misPrestamos.docs.map((d) => d.data())

  // 1. Validar si ya tiene 1 libro apartado o en préstamo
  const tienePrestamoActivo = misDocs.some((d) => ESTADOS_CON_EJEMPLAR.includes(d.estado))
  if (tienePrestamoActivo) {
    throw new Error('Ya tienes un libro apartado o en préstamo. Conclúyelo para poder solicitar otro.')
  }

  // 2. Validar si ya solicitó este libro específico
  const yaSolicitado = misDocs.some(
    (d) => d.libroId === book.id && d.estado === ESTADO_PRESTAMO.PENDIENTE
  )
  if (yaSolicitado) {
    throw new Error('Ya tienes una solicitud pendiente para este libro.')
  }

  // 3. Validar límite máximo de 3 solicitudes vigentes
  const vigentes = misDocs.filter((d) =>
    [ESTADO_PRESTAMO.PENDIENTE, ...ESTADOS_CON_EJEMPLAR].includes(d.estado)
  )
  if (vigentes.length >= MAX_SOLICITUDES_POR_ALUMNO) {
    throw new Error(`Solo puedes tener un máximo de ${MAX_SOLICITUDES_POR_ALUMNO} solicitudes activas.`)
  }

  await addDoc(collection(db, 'prestamos'), {
    libroId: book.id,
    libroTitulo: book.titulo ?? '',
    libroCategoria: book.categoria ?? '',
    uid: user.uid,
    correo: user.email,
    estado: ESTADO_PRESTAMO.PENDIENTE,
    fechaSolicitud: serverTimestamp(),
  })

  // Enviar notificación al admin por correo (sin bloquear si falla la red)
  try {
    const fechaStr = new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
    await sendLoanRequestEmail({
      studentEmail: user.email,
      bookTitle: book.titulo ?? '',
      requestDate: fechaStr,
    })
  } catch {
    // Si falla el envío de correo, la solicitud ya quedó registrada en la base de datos
  }
}

export async function solicitarDevolucion(book, user) {
  const libroRef = doc(db, 'libros', book.id)

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(libroRef)
    const data = snap.data()
    if (!snap.exists() || data.estado !== ESTADO_LIBRO.PRESTADO || data.usuarioUid !== user.uid) {
      throw new Error('No tienes este libro en préstamo.')
    }
    tx.update(libroRef, { estado: ESTADO_LIBRO.DEVOLUCION })
    tx.update(doc(db, 'prestamos', data.prestamoId), {
      estado: ESTADO_PRESTAMO.DEVOLUCION_PENDIENTE,
      fechaSolicitudDevolucion: serverTimestamp(),
    })
  })
}

export async function cancelarSolicitud(book, user) {
  const q = query(
    collection(db, 'prestamos'),
    where('uid', '==', user.uid),
    where('libroId', '==', book.id),
    where('estado', '==', ESTADO_PRESTAMO.PENDIENTE)
  )
  const snap = await getDocs(q)
  if (snap.empty) {
    throw new Error('No se encontró una solicitud pendiente para cancelar.')
  }

  const batch = writeBatch(db)
  snap.docs.forEach((d) => {
    batch.update(doc(db, 'prestamos', d.id), {
      estado: ESTADO_PRESTAMO.CANCELADO,
      fechaCancelacion: serverTimestamp(),
    })
  })
  await batch.commit()
}

// ---------- Acciones del administrador ----------

export async function aprobarSolicitud(prestamo) {
  const libroRef = doc(db, 'libros', prestamo.libroId)
  const prestamoRef = doc(db, 'prestamos', prestamo.id)

  // 1. Validar que el alumno no tenga ya un libro apartado o prestado
  const qAlumno = query(collection(db, 'prestamos'), where('uid', '==', prestamo.uid))
  const prestamosAlumnoSnap = await getDocs(qAlumno)
  const alumnoYaTieneLibro = prestamosAlumnoSnap.docs.some((d) => {
    if (d.id === prestamo.id) return false
    return ESTADOS_CON_EJEMPLAR.includes(d.data().estado)
  })
  if (alumnoYaTieneLibro) {
    throw new Error('Este alumno ya tiene un libro apartado o en préstamo activo.')
  }

  // 2. Otras solicitudes pendientes del mismo libro (se rechazan al autorizar esta)
  const otrasSnap = await getDocs(query(collection(db, 'prestamos'), where('libroId', '==', prestamo.libroId)))
  const otras = otrasSnap.docs.filter((d) => d.id !== prestamo.id && d.data().estado === ESTADO_PRESTAMO.PENDIENTE)
  const tokenRecoleccion = generarTokenRecoleccion()

  await runTransaction(db, async (tx) => {
    const libro = await tx.get(libroRef)
    const actual = await tx.get(prestamoRef)
    if (!libro.exists()) throw new Error('El libro ya no existe.')
    if (estadoLibro(libro.data()) !== ESTADO_LIBRO.DISPONIBLE) {
      throw new Error('Este libro ya no está disponible.')
    }
    if (actual.data()?.estado !== ESTADO_PRESTAMO.PENDIENTE) {
      throw new Error('Esta solicitud ya fue atendida.')
    }
    tx.update(prestamoRef, {
      estado: ESTADO_PRESTAMO.RECOLECCION_PENDIENTE,
      tokenRecoleccion,
      fechaAprobacion: serverTimestamp(),
    })
    tx.update(libroRef, {
      estado: ESTADO_LIBRO.RECOLECCION,
      usuarioUid: prestamo.uid,
      prestamoId: prestamo.id,
    })
    for (const o of otras) {
      tx.update(o.ref, {
        estado: ESTADO_PRESTAMO.RECHAZADO,
        motivo: 'Apartado para otro usuario',
        fechaResolucion: serverTimestamp(),
      })
    }
  })

  // 3. Enviar el token de recolección al correo institucional del titular
  try {
    const fechaStr = new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
    await sendPickupTokenEmail({
      studentEmail: prestamo.correo,
      bookTitle: prestamo.libroTitulo ?? '',
      pickupToken: tokenRecoleccion,
      approvalDate: fechaStr,
    })
  } catch {
    // Si falla el envío de correo, el préstamo ya quedó en estado recoleccion_pendiente
  }

  return otras.length
}

export async function confirmarRecoleccion(prestamo, { tokenIngresado = '', credencialVerificada = false } = {}) {
  if (!credencialVerificada) {
    throw new Error('Debes verificar la credencial física UTSC del alumno antes de entregar el libro.')
  }

  const limpio = tokenIngresado.trim().toUpperCase()
  const esperado = (prestamo.tokenRecoleccion ?? '').toUpperCase()
  const soloDigitos = esperado.replace(/^UTSC-/, '')

  if (!limpio || !esperado || (limpio !== esperado && limpio !== soloDigitos)) {
    throw new Error('El token de recolección no coincide. Verifica el código con el alumno.')
  }

  const libroRef = doc(db, 'libros', prestamo.libroId)
  const prestamoRef = doc(db, 'prestamos', prestamo.id)

  await runTransaction(db, async (tx) => {
    const actual = await tx.get(prestamoRef)
    if (actual.data()?.estado !== ESTADO_PRESTAMO.RECOLECCION_PENDIENTE) {
      throw new Error('Este préstamo ya no está pendiente de recolección.')
    }
    tx.update(prestamoRef, {
      estado: ESTADO_PRESTAMO.ACTIVO,
      credencialVerificada: true,
      fechaRecoleccion: serverTimestamp(),
    })
    tx.update(libroRef, {
      estado: ESTADO_LIBRO.PRESTADO,
    })
  })
}

export const cancelarRecoleccion = (prestamo) =>
  resolverDevolucion(
    prestamo,
    {
      estado: ESTADO_PRESTAMO.RECHAZADO,
      motivo: 'Recolección cancelada o identidad no acreditada en ventanilla',
      fechaResolucion: serverTimestamp(),
    },
    { estado: ESTADO_LIBRO.DISPONIBLE, usuarioUid: deleteField(), prestamoId: deleteField() },
  )

export const rechazarSolicitud = (prestamo) => {
  const batch = writeBatch(db)
  batch.update(doc(db, 'prestamos', prestamo.id), {
    estado: ESTADO_PRESTAMO.RECHAZADO,
    fechaResolucion: serverTimestamp(),
  })
  return batch.commit()
}

function resolverDevolucion(prestamo, prestamoCambios, libroCambios) {
  const batch = writeBatch(db)
  batch.update(doc(db, 'prestamos', prestamo.id), prestamoCambios)
  batch.update(doc(db, 'libros', prestamo.libroId), libroCambios)
  return batch.commit()
}

export const aprobarDevolucion = (prestamo) =>
  resolverDevolucion(
    prestamo,
    { estado: ESTADO_PRESTAMO.DEVUELTO, fechaDevolucion: serverTimestamp() },
    { estado: ESTADO_LIBRO.DISPONIBLE, usuarioUid: deleteField(), prestamoId: deleteField() },
  )

export const rechazarDevolucion = (prestamo) =>
  resolverDevolucion(
    prestamo,
    { estado: ESTADO_PRESTAMO.ACTIVO },
    { estado: ESTADO_LIBRO.PRESTADO },
  )

export async function insertarLibros(libros) {
  const batch = writeBatch(db)
  for (const libro of libros) {
    batch.set(doc(collection(db, 'libros')), {
      ...libro,
      estado: ESTADO_LIBRO.DISPONIBLE,
      fechaAlta: serverTimestamp(),
    })
  }
  await batch.commit()
}
