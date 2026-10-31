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
import { sendLoanRequestEmail } from '../config/emailjs.js'

/*
 * Flujo de préstamos
 *
 * Libro (colección "libros"):
 *   estado: 'disponible' | 'prestado' | 'devolucion'
 *   usuarioUid / prestamoId: solo mientras el libro está prestado
 *
 * Préstamo (colección "prestamos"): historial completo, base de las estadísticas
 *   estado: 'pendiente' -> 'activo' -> 'devolucion_pendiente' -> 'devuelto'
 *           'pendiente' -> 'rechazado'
 *
 * Reglas de negocio:
 * 1. Un alumno puede tener máximo 3 solicitudes/préstamos vigentes (pendiente, activo, devolucion_pendiente).
 * 2. Un alumno solo puede tener 1 libro prestado a la vez (activo / devolucion_pendiente).
 *    Si ya tiene 1 libro prestado, no puede solicitar más libros y sus pendientes quedan pausadas.
 * 3. Al solicitar un libro, se envía notificación por correo al admin.
 * 4. El libro solo se bloquea cuando el administrador autoriza una solicitud; en ese momento
 *    se rechazan las demás solicitudes pendientes de ese mismo libro.
 */

import { ESTADO_LIBRO, ESTADO_PRESTAMO, estadoLibro } from '../data/estados.js'

export const MAX_SOLICITUDES_POR_ALUMNO = 3

export { ESTADO_LIBRO, ESTADO_PRESTAMO, estadoLibro }

// ---------- Acciones del alumno ----------

export async function solicitarLibro(book, user) {
  if (estadoLibro(book) !== ESTADO_LIBRO.DISPONIBLE) {
    throw new Error('Este libro ya no está disponible.')
  }

  // Consultar solicitudes y préstamos del usuario actual
  const q = query(collection(db, 'prestamos'), where('uid', '==', user.uid))
  const misPrestamos = await getDocs(q)
  const misDocs = misPrestamos.docs.map((d) => d.data())

  // 1. Validar si ya tiene 1 libro prestado
  const tienePrestamoActivo = misDocs.some(
    (d) => d.estado === ESTADO_PRESTAMO.ACTIVO || d.estado === ESTADO_PRESTAMO.DEVOLUCION_PENDIENTE
  )
  if (tienePrestamoActivo) {
    throw new Error('Ya tienes un libro en préstamo. Devuélvelo para poder solicitar otro.')
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
    [ESTADO_PRESTAMO.PENDIENTE, ESTADO_PRESTAMO.ACTIVO, ESTADO_PRESTAMO.DEVOLUCION_PENDIENTE].includes(d.estado)
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

  // 1. Validar que el alumno no tenga ya un libro prestado en activo
  const qAlumno = query(collection(db, 'prestamos'), where('uid', '==', prestamo.uid))
  const prestamosAlumnoSnap = await getDocs(qAlumno)
  const alumnoYaTieneLibro = prestamosAlumnoSnap.docs.some((d) => {
    if (d.id === prestamo.id) return false
    const estado = d.data().estado
    return estado === ESTADO_PRESTAMO.ACTIVO || estado === ESTADO_PRESTAMO.DEVOLUCION_PENDIENTE
  })
  if (alumnoYaTieneLibro) {
    throw new Error('Este alumno ya tiene un libro en préstamo activo. Debe devolverlo antes de recibir otro.')
  }

  // 2. Otras solicitudes pendientes del mismo libro (se rechazan al autorizar esta)
  const otrasSnap = await getDocs(query(collection(db, 'prestamos'), where('libroId', '==', prestamo.libroId)))
  const otras = otrasSnap.docs.filter((d) => d.id !== prestamo.id && d.data().estado === ESTADO_PRESTAMO.PENDIENTE)

  await runTransaction(db, async (tx) => {
    const libro = await tx.get(libroRef)
    const actual = await tx.get(prestamoRef)
    if (!libro.exists()) throw new Error('El libro ya no existe.')
    if (estadoLibro(libro.data()) !== ESTADO_LIBRO.DISPONIBLE) {
      throw new Error('Este libro ya está prestado a otro usuario.')
    }
    if (actual.data()?.estado !== ESTADO_PRESTAMO.PENDIENTE) {
      throw new Error('Esta solicitud ya fue atendida.')
    }
    tx.update(prestamoRef, { estado: ESTADO_PRESTAMO.ACTIVO, fechaAprobacion: serverTimestamp() })
    tx.update(libroRef, {
      estado: ESTADO_LIBRO.PRESTADO,
      usuarioUid: prestamo.uid,
      prestamoId: prestamo.id,
    })
    for (const o of otras) {
      tx.update(o.ref, {
        estado: ESTADO_PRESTAMO.RECHAZADO,
        motivo: 'Prestado a otro usuario',
        fechaResolucion: serverTimestamp(),
      })
    }
  })
  return otras.length
}

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
