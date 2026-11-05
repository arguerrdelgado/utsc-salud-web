import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../config/firebase.js'
import { calcularEstadisticas } from '../../utils/estadisticas.js'

function Kpi({ label, value, color = 'text-emerald-300' }) {
  return (
    <div className="rounded-xl border border-emerald-500/15 bg-emerald-950/30 px-4 py-3">
      <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}

function PodioItem({ lugar, item, mayor }) {
  if (!item) {
    return (
      <div className="rounded-xl border border-emerald-500/10 bg-emerald-950/20 p-4 flex flex-col items-center justify-center text-center opacity-40 min-h-[140px]">
        <span className="text-2xl mb-1 grayscale">🏆</span>
        <span className="text-xs text-slate-500 font-medium">Sin libro en podio</span>
      </div>
    )
  }

  const configs = {
    1: {
      medalla: '🥇',
      posicion: '1er Lugar',
      borde: 'border-amber-400/50 hover:border-amber-400/80',
      bg: 'bg-gradient-to-b from-amber-500/15 via-emerald-950/40 to-emerald-950/70 shadow-lg shadow-amber-500/5',
      textoNum: 'text-amber-300',
      badge: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
      altura: 'md:min-h-[190px] order-1 md:order-2 ring-1 ring-amber-400/20',
      barra: 'from-amber-400 to-amber-200',
    },
    2: {
      medalla: '🥈',
      posicion: '2do Lugar',
      borde: 'border-slate-300/40 hover:border-slate-300/70',
      bg: 'bg-gradient-to-b from-slate-300/10 via-emerald-950/40 to-emerald-950/70',
      textoNum: 'text-slate-200',
      badge: 'bg-slate-300/20 text-slate-200 border-slate-300/40',
      altura: 'md:min-h-[170px] order-2 md:order-1',
      barra: 'from-slate-300 to-slate-100',
    },
    3: {
      medalla: '🥉',
      posicion: '3er Lugar',
      borde: 'border-amber-700/40 hover:border-amber-600/70',
      bg: 'bg-gradient-to-b from-amber-700/10 via-emerald-950/40 to-emerald-950/70',
      textoNum: 'text-amber-500',
      badge: 'bg-amber-700/25 text-amber-400 border-amber-600/40',
      altura: 'md:min-h-[150px] order-3 md:order-3',
      barra: 'from-amber-600 to-amber-400',
    },
  }[lugar]

  const pct = Math.min(100, Math.round((item.total / Math.max(1, mayor)) * 100))

  return (
    <div
      className={`rounded-2xl border ${configs.borde} ${configs.bg} ${configs.altura} p-4 flex flex-col justify-between transition-all duration-300`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">{configs.medalla}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${configs.badge}`}>
              {configs.posicion}
            </span>
          </div>
          <span className={`font-display text-2xl md:text-3xl font-extrabold ${configs.textoNum}`}>
            {item.total}
          </span>
        </div>

        <p
          className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug mt-1"
          title={item.titulo || item.libroId}
        >
          {item.titulo || item.libroId}
        </p>
      </div>

      <div className="mt-3 pt-2.5 border-t border-white/5">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span>Préstamos autorizados</span>
          <span className="font-mono text-xs text-slate-300">{item.total}</span>
        </div>
        <div className="h-1.5 rounded-full bg-black/40 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${configs.barra}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function PodioLibros({ items }) {
  const top3 = items.slice(0, 3)
  const mayor = Math.max(1, ...top3.map((i) => i.total))

  const primero = top3[0]
  const segundo = top3[1]
  const tercero = top3[2]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-400 flex items-center gap-2">
          <span>🏆</span> Libros más solicitados (Top 3)
        </h3>
        <span className="text-xs text-emerald-400/80 font-medium">Solo autorizados</span>
      </div>

      {top3.length === 0 ? (
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-950/30 p-5 text-center">
          <p className="text-sm text-slate-500">Aún no hay préstamos autorizados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-end">
          <PodioItem lugar={2} item={segundo} mayor={mayor} />
          <PodioItem lugar={1} item={primero} mayor={mayor} />
          <PodioItem lugar={3} item={tercero} mayor={mayor} />
        </div>
      )}
    </div>
  )
}

export default function Estadisticas() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [mostrarSinPrestamos, setMostrarSinPrestamos] = useState(false)

  useEffect(() => {
    Promise.all([getDocs(collection(db, 'prestamos')), getDocs(collection(db, 'libros'))])
      .then(([pSnap, lSnap]) => {
        const prestamos = pSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        const libros = lSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setStats(calcularEstadisticas(prestamos, libros))
      })
      .catch(() => setError('No se pudieron cargar las estadísticas. Verifica las reglas de Firestore.'))
  }, [])

  if (error) return <p className="text-red-400 text-sm">{error}</p>
  if (!stats) return <p className="text-slate-400 text-sm">Calculando estadísticas...</p>

  const topUsuario = stats.usuariosActivos[0]

  return (
    <div className="flex flex-col gap-8">
      {/* KPIs Generales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Solicitudes totales" value={stats.totalSolicitudes} />
        <Kpi label="Préstamos activos" value={stats.porEstado.activo + stats.porEstado.devolucion_pendiente} color="text-sky-300" />
        <Kpi label="Devueltos" value={stats.porEstado.devuelto} />
        <Kpi label="Rechazados" value={stats.porEstado.rechazado} color="text-red-300" />
        <Kpi label="Libros en catálogo" value={stats.totalLibros} color="text-white" />
        <Kpi label="Disponibles" value={stats.librosDisponibles} />
        <Kpi label="No disponibles" value={stats.librosNoDisponibles} color="text-amber-300" />
        <Kpi label="Pendientes de autorizar" value={stats.porEstado.pendiente + stats.porEstado.devolucion_pendiente} color="text-amber-300" />
      </div>

      {/* Podio Top 3 Libros más solicitados (solo autorizados) */}
      <PodioLibros items={stats.masSolicitados} />

      {/* Préstamos por categoría (5 tarjetas como la referencia) */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-400 flex items-center gap-2">
          <span>🏷️</span> Préstamos por categoría
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.porCategoria.map((cat) => (
            <div
              key={cat.nombre}
              className="rounded-xl border border-emerald-500/15 bg-emerald-950/30 px-4 py-3 flex flex-col justify-between hover:border-emerald-500/30 transition-all"
            >
              <p className="font-display text-2xl font-bold text-emerald-300">{cat.total}</p>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-tight" title={cat.nombre}>
                {cat.nombre}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Usuario con más libros prestados (solo 1 usuario) */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-400 flex items-center gap-2">
          <span>👑</span> Usuario con más libros prestados
        </h3>
        {topUsuario ? (
          <div className="rounded-xl border border-emerald-500/15 bg-emerald-950/30 px-4 py-3 flex items-center justify-between hover:border-emerald-500/30 transition-all">
            <div className="min-w-0 pr-3">
              <p className="font-display text-2xl font-bold text-emerald-300">{topUsuario.total}</p>
              <p className="text-xs text-slate-300 mt-0.5 font-medium truncate" title={topUsuario.correo}>
                {topUsuario.correo}
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
              Top #1 Lector
            </span>
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-500/15 bg-emerald-950/30 px-4 py-3 text-center">
            <p className="text-xs text-slate-500">Sin préstamos autorizados registrados.</p>
          </div>
        )}
      </div>

      {/* Libros sin préstamos (Gris colapsable) */}
      {stats.nuncaSolicitados.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setMostrarSinPrestamos(!mostrarSinPrestamos)}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Libros sin préstamos completados ({stats.nuncaSolicitados.length})
              </span>
            </div>
            <span className="text-xs font-medium text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md">
              {mostrarSinPrestamos ? 'Ocultar ▲' : 'Ver lista ▼'}
            </span>
          </button>

          {mostrarSinPrestamos && (
            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40">
              <div className="flex flex-wrap gap-2">
                {stats.nuncaSolicitados.map((l) => (
                  <span
                    key={l.id}
                    className="text-xs rounded-md border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-slate-400 hover:text-slate-200 transition-colors"
                    title={l.titulo ?? l.Titulo}
                  >
                    {l.titulo ?? l.Titulo}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
