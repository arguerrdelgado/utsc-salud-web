import { CATEGORIAS } from '../data/categorias.js'

// Cálculos de estadísticas a partir de los préstamos y libros
// Criterio: Solo se consideran libros más solicitados, categorías y usuarios cuando los préstamos han sido autorizados (activo, devolucion_pendiente o devuelto)

const ESTADOS_AUTORIZADOS = new Set(['activo', 'devolucion_pendiente', 'devuelto'])

export const DIAS_POR_PERIODO = {
  '30d': 30,
  '180d': 180,
  '365d': 365,
}

export function getTimestampMillis(val) {
  if (!val) return null
  if (typeof val.toMillis === 'function') return val.toMillis()
  if (typeof val.toDate === 'function') return val.toDate().getTime()
  if (typeof val.seconds === 'number') return val.seconds * 1000
  if (val instanceof Date) return val.getTime()
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const parsed = Date.parse(val)
    return isNaN(parsed) ? null : parsed
  }
  return null
}

export function filtrarPrestamosPorPeriodo(prestamos = [], periodo = 'all', now = Date.now()) {
  if (!periodo || periodo === 'all' || !DIAS_POR_PERIODO[periodo]) return prestamos
  const dias = DIAS_POR_PERIODO[periodo]
  const cutoff = now - dias * 24 * 60 * 60 * 1000

  return prestamos.filter((p) => {
    const ts =
      getTimestampMillis(p.fechaSolicitud) ??
      getTimestampMillis(p.createdAt) ??
      getTimestampMillis(p.fechaAprobacion) ??
      getTimestampMillis(p.fechaRecoleccion) ??
      getTimestampMillis(p.fechaResolucion) ??
      getTimestampMillis(p.fechaSolicitudDevolucion) ??
      getTimestampMillis(p.fechaDevolucion)

    return ts !== null && ts >= cutoff
  })
}

export function calcularEstadisticas(prestamos = [], libros = [], periodo = 'all', now = Date.now()) {
  const prestamosFiltrados = filtrarPrestamosPorPeriodo(prestamos, periodo, now)
  const porLibro = new Map()
  const porCategoria = new Map()
  const porUsuario = new Map()
  const porEstado = {
    pendiente: 0,
    recoleccion_pendiente: 0,
    activo: 0,
    devolucion_pendiente: 0,
    devuelto: 0,
    rechazado: 0,
  }

  // Inicializar las 5 categorías oficiales con 0
  for (const cat of CATEGORIAS) {
    porCategoria.set(cat, 0)
  }

  for (const p of prestamosFiltrados) {
    if (p.estado in porEstado) porEstado[p.estado] += 1

    // Solo contabiliza si el préstamo fue entregado/autorizado
    if (ESTADOS_AUTORIZADOS.has(p.estado)) {
      const actual = porLibro.get(p.libroId) ?? { libroId: p.libroId, titulo: p.libroTitulo, total: 0 }
      actual.total += 1
      porLibro.set(p.libroId, actual)

      if (p.libroCategoria) {
        porCategoria.set(p.libroCategoria, (porCategoria.get(p.libroCategoria) ?? 0) + 1)
      }

      if (p.correo) {
        porUsuario.set(p.correo, (porUsuario.get(p.correo) ?? 0) + 1)
      }
    }
  }

  const ordenar = (arr) => arr.sort((a, b) => b.total - a.total)

  const librosNoDisponibles = libros.filter((l) => (l.estado ?? 'disponible') !== 'disponible').length

  return {
    totalSolicitudes: prestamosFiltrados.length,
    porEstado,
    masSolicitados: ordenar([...porLibro.values()]),
    porCategoria: CATEGORIAS.map((nombre) => ({
      nombre,
      total: porCategoria.get(nombre) ?? 0,
    })),
    usuariosActivos: ordenar([...porUsuario.entries()].map(([correo, total]) => ({ correo, total }))),
    totalLibros: libros.length,
    librosDisponibles: libros.length - librosNoDisponibles,
    librosNoDisponibles,
    nuncaSolicitados: libros.filter((l) => !porLibro.has(l.id)),
  }
}
