import { CATEGORIAS } from '../data/categorias.js'

// Cálculos de estadísticas a partir de los préstamos y libros
// Criterio: Solo se consideran libros más solicitados, categorías y usuarios cuando los préstamos han sido autorizados (activo, devolucion_pendiente o devuelto)

const ESTADOS_AUTORIZADOS = new Set(['activo', 'devolucion_pendiente', 'devuelto'])

export function calcularEstadisticas(prestamos = [], libros = []) {
  const porLibro = new Map()
  const porCategoria = new Map()
  const porUsuario = new Map()
  const porEstado = { pendiente: 0, activo: 0, devolucion_pendiente: 0, devuelto: 0, rechazado: 0 }

  // Inicializar las 5 categorías oficiales con 0
  for (const cat of CATEGORIAS) {
    porCategoria.set(cat, 0)
  }

  for (const p of prestamos) {
    if (p.estado in porEstado) porEstado[p.estado] += 1

    // Solo contabiliza si el préstamo fue autorizado
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
    totalSolicitudes: prestamos.length,
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
