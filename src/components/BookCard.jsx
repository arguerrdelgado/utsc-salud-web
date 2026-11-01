import { motion } from 'framer-motion'
import { ESTADO_LIBRO, estadoLibro } from '../data/estados.js'

const CATEGORY_COLORS = {
  'Educación y Promoción de la Salud': 'bg-emerald-400',
  'Infectología e Inmunología': 'bg-teal-400',
  'Referencia y Clasificación Médica': 'bg-cyan-400',
  'Epidemiología y Salud Pública': 'bg-green-400',
  'Nutrición y Enfermedades Crónicas': 'bg-lime-400',
}

const pillBase =
  'w-full py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-1.5'

const btnActionBase = `${pillBase} active:scale-95 text-[#04120c] disabled:opacity-50`
const pillDisabledBase = `${pillBase} cursor-default select-none`

export default function BookCard({
  book,
  uid,
  tieneSolicitudPendiente = false,
  tienePrestamoActivo = false,
  limiteAlcanzado = false,
  onSolicitar,
  onDevolver,
  onCancelar,
  busy = false,
  busyAction = null,
}) {
  const tabColor = CATEGORY_COLORS[book.categoria] || 'bg-emerald-400'
  const estado = estadoLibro(book)
  const esMio = !!uid && book.usuarioUid === uid
  const estaPrestado = estado === ESTADO_LIBRO.PRESTADO || estado === ESTADO_LIBRO.DEVOLUCION

  // 1. Estado objetivo del ejemplar en biblioteca (para la portada)
  const bookBadge = estaPrestado
    ? { text: 'Prestado', className: 'bg-red-500/25 text-red-300 border border-red-500/30' }
    : { text: 'Disponible', className: 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/30' }

  return (
    <motion.div
      whileHover={{ y: -6, rotate: -0.5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative bg-emerald-950/20 border border-emerald-500/15 hover:border-emerald-500/30 rounded-xl overflow-hidden flex flex-col h-full transition-colors"
    >
      <span className={`absolute left-0 top-4 h-8 w-1.5 rounded-r ${tabColor}`} aria-hidden="true" />

      {/* Portada con Badge objetivo del ejemplar */}
      <div className="relative h-52 py-4 flex items-center justify-center bg-black/30 overflow-hidden">
        <img
          src={book.portada}
          alt={book.titulo}
          className="max-h-full w-auto max-w-[80%] object-contain transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur ${bookBadge.className}`}
        >
          {bookBadge.text}
        </span>
      </div>

      <div className="p-4 pl-5 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${tabColor}`} />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{book.categoria}</span>
        </div>
        <h3 className="font-display font-bold text-white leading-snug">{book.titulo}</h3>
        <p className="text-sm text-slate-400 italic">{book.autor}</p>
        <p className="text-sm text-slate-400 flex-1">{book.resumen}</p>
        <div className="text-xs text-slate-500 border-t border-dashed border-emerald-500/15 pt-2 flex justify-between">
          <span>{book.editorial}</span>
          <span className="font-mono">{book.isbn}</span>
        </div>

        {/* Zona clara de estado del usuario y acciones */}
        <div className="mt-2 pt-2 flex flex-col gap-2">
          {/* Bloque de carga activa para evitar saltos o textos invertidos */}
          {busyAction === 'solicitar' ? (
            <button disabled className={`${btnActionBase} bg-emerald-400 opacity-75 cursor-wait`}>
              SOLICITANDO...
            </button>
          ) : busyAction === 'cancelar' ? (
            <button disabled className={`${btnActionBase} bg-amber-400 opacity-75 cursor-wait`}>
              CANCELANDO...
            </button>
          ) : busyAction === 'devolver' ? (
            <button disabled className={`${btnActionBase} bg-sky-400 opacity-75 cursor-wait`}>
              DEVOLVIENDO...
            </button>
          ) : esMio && estaPrestado ? (
            /* Caso 1: El libro está en poder de este alumno */
            <div className="flex flex-col gap-2">
              <div className="rounded-full bg-sky-500/10 border border-sky-500/25 px-3 py-2 text-xs flex items-center justify-center gap-2 text-sky-200">
                <span className="text-sm">📘</span>
                <span className="font-semibold text-[11px] uppercase tracking-wide">
                  {estado === ESTADO_LIBRO.DEVOLUCION
                    ? 'Devolución en proceso'
                    : 'En tu poder'}
                </span>
              </div>
              {estado !== ESTADO_LIBRO.DEVOLUCION && onDevolver && (
                <button
                  onClick={() => onDevolver(book)}
                  disabled={busy}
                  className={`${btnActionBase} bg-sky-400 hover:bg-sky-300`}
                >
                  {busy ? 'DEVOLVIENDO...' : 'DEVOLVER LIBRO'}
                </button>
              )}
            </div>
          ) : estaPrestado ? (
            /* Caso 2: El libro está prestado a otro alumno */
            <div className={`${pillDisabledBase} border border-red-500/25 bg-red-500/10 text-red-300/90`}>
              NO DISPONIBLE
            </div>
          ) : tieneSolicitudPendiente ? (
            /* Caso 3: Este alumno ya tiene solicitud pendiente */
            onCancelar ? (
              <button
                onClick={() => onCancelar(book)}
                disabled={busy}
                className={`${btnActionBase} bg-amber-400 hover:bg-amber-300`}
              >
                {busy ? 'CANCELANDO...' : 'CANCELAR SOLICITUD'}
              </button>
            ) : null
          ) : tienePrestamoActivo ? (
            /* Caso 4: Libro libre, pero el alumno ya tiene un libro en mano */
            <div className={`${pillDisabledBase} border border-slate-500/25 bg-slate-500/10 text-slate-400`}>
              DEVUELVE TU LIBRO ACTUAL
            </div>
          ) : limiteAlcanzado ? (
            /* Caso 5: Libro libre, pero alumno tiene 3 solicitudes */
            <div className={`${pillDisabledBase} border border-slate-500/25 bg-slate-500/10 text-slate-400`}>
              LÍMITE ALCANZADO
            </div>
          ) : (
            /* Caso 6: Disponible y listo para solicitar */
            onSolicitar && (
              <button
                onClick={() => onSolicitar(book)}
                disabled={busy}
                className={`${btnActionBase} bg-emerald-400 hover:bg-emerald-300`}
              >
                {busy ? 'SOLICITANDO...' : 'SOLICITAR PRÉSTAMO'}
              </button>
            )
          )}
        </div>
      </div>
    </motion.div>
  )
}
