import { describe, it, expect } from 'vitest'
import { calcularEstadisticas, filtrarPrestamosPorPeriodo, getTimestampMillis } from '../estadisticas.js'
import { generarScriptLibros } from '../generarScript.js'

const prestamos = [
  { libroId: 'a', libroTitulo: 'Libro A', libroCategoria: 'Infectología e Inmunología', correo: 'x@u.mx', estado: 'devuelto' },
  { libroId: 'a', libroTitulo: 'Libro A', libroCategoria: 'Infectología e Inmunología', correo: 'y@u.mx', estado: 'activo' },
  { libroId: 'b', libroTitulo: 'Libro B', libroCategoria: 'Educación y Promoción de la Salud', correo: 'x@u.mx', estado: 'rechazado' },
  { libroId: 'b', libroTitulo: 'Libro B', libroCategoria: 'Educación y Promoción de la Salud', correo: 'z@u.mx', estado: 'devuelto' },
  { libroId: 'b', libroTitulo: 'Libro B', libroCategoria: 'Educación y Promoción de la Salud', correo: 'z@u.mx', estado: 'devuelto' },
]
const libros = [{ id: 'a', estado: 'prestado' }, { id: 'b' }, { id: 'c', titulo: 'Libro C' }]

describe('calcularEstadisticas', () => {
  const s = calcularEstadisticas(prestamos, libros)

  it('suma préstamos autorizados (activos y devueltos) en los más solicitados', () => {
    // a tiene 1 devuelto + 1 activo = 2 autorizados
    // b tiene 2 devueltos + 1 rechazado (no suma) = 2 autorizados
    expect(s.masSolicitados).toHaveLength(2)
    expect(s.masSolicitados.find((l) => l.libroId === 'a')).toMatchObject({ libroId: 'a', total: 2 })
    expect(s.masSolicitados.find((l) => l.libroId === 'b')).toMatchObject({ libroId: 'b', total: 2 })
  })

  it('cuenta por estado y disponibilidad', () => {
    expect(s.totalSolicitudes).toBe(5)
    expect(s.porEstado).toMatchObject({ activo: 1, devuelto: 3, rechazado: 1 })
    expect(s.librosDisponibles).toBe(2)
    expect(s.librosNoDisponibles).toBe(1)
  })

  it('incluye las 5 categorías oficiales', () => {
    expect(s.porCategoria).toHaveLength(5)
    const inf = s.porCategoria.find((c) => c.nombre === 'Infectología e Inmunología')
    expect(inf?.total).toBe(2)
  })

  it('detecta libros que nunca se han solicitado o autorizado', () => {
    expect(s.nuncaSolicitados.map((l) => l.id)).toEqual(['c'])
  })

  it('filtra correctamente según el periodo seleccionado (30d, 180d, 365d)', () => {
    const now = 1000000000000
    const dayMs = 86400000
    const prestamosConFechas = [
      { id: '1', libroId: 'a', estado: 'activo', fechaSolicitud: { toMillis: () => now - 5 * dayMs } }, // 5 días atrás (< 30d)
      { id: '2', libroId: 'b', estado: 'devuelto', fechaSolicitud: { toMillis: () => now - 50 * dayMs } }, // 50 días atrás (> 30d, < 180d)
      { id: '3', libroId: 'c', estado: 'devuelto', fechaSolicitud: { toMillis: () => now - 200 * dayMs } }, // 200 días atrás (> 180d, < 365d)
      { id: '4', libroId: 'd', estado: 'devuelto', fechaSolicitud: { toMillis: () => now - 400 * dayMs } }, // 400 días atrás (> 365d)
    ]

    const statsMes = calcularEstadisticas(prestamosConFechas, libros, '30d', now)
    expect(statsMes.totalSolicitudes).toBe(1)

    const statsSemestre = calcularEstadisticas(prestamosConFechas, libros, '180d', now)
    expect(statsSemestre.totalSolicitudes).toBe(2)

    const statsAnio = calcularEstadisticas(prestamosConFechas, libros, '365d', now)
    expect(statsAnio.totalSolicitudes).toBe(3)

    const statsTodo = calcularEstadisticas(prestamosConFechas, libros, 'all', now)
    expect(statsTodo.totalSolicitudes).toBe(4)
  })
})

describe('generarScriptLibros', () => {
  it('incluye los libros y usa firebase-admin', () => {
    const script = generarScriptLibros([{ titulo: 'Nuevo', autor: 'Yo' }])
    expect(script).toContain("import admin from 'firebase-admin'")
    expect(script).toContain('"titulo": "Nuevo"')
    expect(script).toContain("collection('libros')")
  })
})
