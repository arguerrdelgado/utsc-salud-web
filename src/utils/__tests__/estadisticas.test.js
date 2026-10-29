import { describe, it, expect } from 'vitest'
import { calcularEstadisticas } from '../estadisticas.js'
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
})

describe('generarScriptLibros', () => {
  it('incluye los libros y usa firebase-admin', () => {
    const script = generarScriptLibros([{ titulo: 'Nuevo', autor: 'Yo' }])
    expect(script).toContain("import admin from 'firebase-admin'")
    expect(script).toContain('"titulo": "Nuevo"')
    expect(script).toContain("collection('libros')")
  })
})
