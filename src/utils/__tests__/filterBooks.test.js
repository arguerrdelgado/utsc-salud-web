import { describe, it, expect } from 'vitest'
import { filterBooks } from '../filterBooks.js'

const books = [
  { id: 1, titulo: 'Manual de Primeros Auxilios', autor: 'Elena Cavazos', editorial: 'UTSC', isbn: '111', categoria: 'Educación y Promoción de la Salud' },
  { id: 2, titulo: 'Inmunología Clínica', autor: 'Raúl Montemayor', editorial: 'Trillas', isbn: '222', categoria: 'Infectología e Inmunología' },
]

describe('filterBooks', () => {
  it('regresa todos los libros sin filtros', () => {
    expect(filterBooks(books)).toHaveLength(2)
  })

  it('filtra por texto de busqueda en titulo', () => {
    expect(filterBooks(books, { search: 'inmuno' })).toHaveLength(1)
  })

  it('filtra por autor (case-insensitive)', () => {
    expect(filterBooks(books, { search: 'CAVAZOS' })).toHaveLength(1)
  })

  it('filtra por categoria', () => {
    expect(filterBooks(books, { categoria: 'Infectología e Inmunología' })).toHaveLength(1)
  })

  it('combina busqueda y categoria sin coincidencias', () => {
    expect(filterBooks(books, { search: 'manual', categoria: 'Infectología e Inmunología' })).toHaveLength(0)
  })

  it('no rompe con arreglo vacio', () => {
    expect(filterBooks([], { search: 'x' })).toEqual([])
  })
})
