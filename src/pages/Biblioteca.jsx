import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../config/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import BookCard from '../components/BookCard.jsx'
import { filterBooks } from '../utils/filterBooks.js'
import { CATEGORIAS } from '../data/categorias.js'
import { solicitarLibro, solicitarDevolucion, cancelarSolicitud } from '../services/prestamos.js'

const inputClasses =
  'rounded-lg bg-emerald-950/20 border border-emerald-500/15 text-slate-200 placeholder:text-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/60 transition-shadow'

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

function Skeleton() {
  return (
    <div className="bg-emerald-950/20 border border-emerald-500/10 rounded-xl overflow-hidden animate-pulse">
      <div className="h-40 bg-emerald-500/10" />
      <div className="p-4 space-y-2">
        <div className="h-2 w-24 bg-emerald-500/10 rounded" />
        <div className="h-4 w-3/4 bg-emerald-500/10 rounded" />
        <div className="h-3 w-1/2 bg-emerald-500/10 rounded" />
        <div className="h-3 w-full bg-emerald-500/10 rounded" />
      </div>
    </div>
  )
}

export default function Biblioteca() {
  const { user } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('')
  const [busyOp, setBusyOp] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [misPendientes, setMisPendientes] = useState(new Set())
  const [tienePrestamoActivo, setTienePrestamoActivo] = useState(false)
  const [solicitudesVigentesCount, setSolicitudesVigentesCount] = useState(0)

  useEffect(() => {
    if (!user) return
    setLoading(true)

    // Tiempo real: el catálogo y la disponibilidad de libros
    const unsubLibros = onSnapshot(collection(db, 'libros'), (snap) => {
      const fetched = snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          titulo: data.titulo ?? data.Titulo,
          autor: data.autor ?? data.Autor,
          categoria: data.categoria ?? data.Seccion,
          resumen: data.resumen ?? data.Resumen,
          editorial: data.editorial ?? data.Editorial,
          isbn: data.isbn ?? data.ISBN,
          portada: data.portada ?? data.imagenUrl,
          estado: data.estado,
          usuarioUid: data.usuarioUid,
        }
      })
      setBooks(fetched)
      setLoading(false)
    })

    // Tiempo real: solicitudes y préstamos de ESTE usuario
    const q = query(collection(db, 'prestamos'), where('uid', '==', user.uid))
    const unsubPrestamos = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => d.data())
        const pendientes = new Set(
          docs.filter((d) => d.estado === 'pendiente').map((d) => d.libroId)
        )
        const activo = docs.some((d) =>
          ['recoleccion_pendiente', 'activo', 'devolucion_pendiente'].includes(d.estado)
        )
        const vigentes = docs.filter((d) =>
          ['pendiente', 'recoleccion_pendiente', 'activo', 'devolucion_pendiente'].includes(d.estado)
        ).length

        setMisPendientes(pendientes)
        setTienePrestamoActivo(activo)
        setSolicitudesVigentesCount(vigentes)
      },
      () => {
        setMisPendientes(new Set())
        setTienePrestamoActivo(false)
        setSolicitudesVigentesCount(0)
      }
    )

    return () => {
      unsubLibros()
      unsubPrestamos()
    }
  }, [user])

  const ejecutar = async (book, accion, mensajeOk, tipo) => {
    setBusyOp({ id: book.id, tipo })
    setAviso(null)
    try {
      await accion(book, user)
      setAviso({ tipo: 'ok', texto: mensajeOk })
    } catch (err) {
      setAviso({
        tipo: 'error',
        texto: err.code === 'permission-denied'
          ? 'No tienes permiso para realizar esta acción.'
          : err.message || 'No se pudo completar la operación.',
      })
    } finally {
      setBusyOp(null)
    }
  }

  const handleSolicitar = (book) =>
    ejecutar(book, solicitarLibro, `Solicitaste "${book.titulo}". El administrador debe autorizar el apartado.`, 'solicitar')

  const handleDevolver = (book) =>
    ejecutar(book, solicitarDevolucion, `Solicitaste devolver "${book.titulo}". El administrador debe confirmar la devolución.`, 'devolver')

  const handleCancelar = (book) =>
    ejecutar(book, cancelarSolicitud, `Cancelaste tu solicitud de "${book.titulo}".`, 'cancelar')


  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="h-16 w-16 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center mb-6"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="10" width="16" height="10" rx="1.5" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="font-display text-2xl font-bold text-white"
        >
          Acceso Exclusivo para Estudiantes UTSC
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.4 }}
          className="mt-3 text-slate-400 max-w-md"
        >
          La Biblioteca Digital de Salud y Prevención es un recurso exclusivo para la comunidad universitaria.
          Para acceder al catálogo necesitas iniciar sesión con tu cuenta institucional @virtual.utsc.edu.mx.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, duration: 0.4 }}>
          <Link
            to="/login"
            className="inline-block mt-6 bg-emerald-400 hover:bg-emerald-300 active:scale-95 transition-all text-[#04120c] font-bold uppercase tracking-wide px-7 py-3 rounded-full"
          >
            Iniciar sesión
          </Link>
        </motion.div>
      </div>
    )
  }

  const filtered = filterBooks(books, { search, categoria })

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-14">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl font-bold text-emerald-400"
          >
            Biblioteca de Salud y Prevención
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-2 text-slate-400"
          >
            Consulta el catálogo de libros de salud y prevención disponible para la comunidad UTSC.
          </motion.p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="rounded-full border border-emerald-500/20 bg-emerald-950/40 px-3 py-1 text-slate-300">
              Solicitudes activas: <strong className="text-emerald-400">{solicitudesVigentesCount}/3</strong>
            </span>
            {tienePrestamoActivo ? (
              <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 font-medium text-sky-300">
                Tienes 1 libro apartado o en préstamo (conclúyelo para solicitar otro)
              </span>
            ) : solicitudesVigentesCount >= 3 ? (
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 font-medium text-amber-300">
                Límite de solicitudes alcanzado (máx. 3)
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, autor, editorial, isbn..."
              className={`w-full pl-9 pr-4 ${inputClasses}`}
            />
          </div>
          <div className="relative">
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className={`${inputClasses} appearance-none pr-10 cursor-pointer`}
            >
              <option value="" style={{ backgroundColor: '#0a2118', color: '#e2e8f0' }}>Todas las categorías</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c} style={{ backgroundColor: '#0a2118', color: '#e2e8f0' }}>{c}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>

        <AnimatePresence>
          {aviso && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mb-6 flex items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm ${
                aviso.tipo === 'ok'
                  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                  : 'border-red-400/30 bg-red-400/10 text-red-200'
              }`}
            >
              <span>{aviso.texto}</span>
              <button onClick={() => setAviso(null)} className="opacity-70 hover:opacity-100" aria-label="Cerrar aviso">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <p className="font-display text-xl text-white mb-2">Sin resultados en el catálogo</p>
            <p className="text-slate-400 text-sm mb-4">Prueba con otro término o cambia de categoría.</p>
            <button
              onClick={() => { setSearch(''); setCategoria('') }}
              className="text-emerald-400 font-semibold hover:underline"
            >
              Limpiar filtros
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={gridVariants}
            initial="hidden"
            animate="show"
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filtered.map((b) => (
                <motion.div key={b.id} variants={cardVariants} layout exit={{ opacity: 0, scale: 0.95 }}>
                  <BookCard
                    book={b}
                    uid={user.uid}
                    tieneSolicitudPendiente={misPendientes.has(b.id)}
                    tienePrestamoActivo={tienePrestamoActivo}
                    limiteAlcanzado={solicitudesVigentesCount >= 3}
                    onSolicitar={handleSolicitar}
                    onDevolver={handleDevolver}
                    onCancelar={handleCancelar}
                    busy={busyOp?.id === b.id}
                    busyAction={busyOp?.id === b.id ? busyOp.tipo : null}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}
