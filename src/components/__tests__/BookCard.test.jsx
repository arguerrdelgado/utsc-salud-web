import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BookCard from '../BookCard.jsx'

const book = {
  titulo: 'Manual de Primeros Auxilios',
  autor: 'Elena Cavazos',
  categoria: 'Educación y Promoción de la Salud',
  resumen: 'Guia practica.',
  editorial: 'UTSC',
  isbn: '978-000',
  portada: 'https://example.com/img.jpg',
}

describe('BookCard', () => {
  it('muestra titulo, autor, editorial e isbn', () => {
    render(<BookCard book={book} />)
    expect(screen.getByText(book.titulo)).toBeInTheDocument()
    expect(screen.getByText(book.autor)).toBeInTheDocument()
    expect(screen.getByText('UTSC')).toBeInTheDocument()
    expect(screen.getByText('978-000')).toBeInTheDocument()
  })

  const noop = () => {}

  it('muestra "Solicitar préstamo" si está disponible', () => {
    render(<BookCard book={book} uid="u1" onSolicitar={noop} onDevolver={noop} />)
    expect(screen.getByRole('button', { name: /solicitar préstamo/i })).toBeInTheDocument()
  })

  it('muestra botón de cancelar solicitud si el usuario ya la solicitó', () => {
    render(<BookCard book={book} uid="u1" tieneSolicitudPendiente={true} onSolicitar={noop} onCancelar={noop} />)
    expect(screen.getByRole('button', { name: /cancelar solicitud/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /solicitar préstamo/i })).toBeNull()
  })

  it('permite cancelar la solicitud aunque el usuario tenga otro libro en préstamo activo', () => {
    render(
      <BookCard
        book={book}
        uid="u1"
        tieneSolicitudPendiente={true}
        tienePrestamoActivo={true}
        onSolicitar={noop}
        onCancelar={noop}
      />
    )
    expect(screen.getByRole('button', { name: /cancelar solicitud/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /solicitar préstamo/i })).toBeNull()
  })

  it('muestra mensaje de advertencia si el usuario ya tiene 1 libro prestado y quiere pedir otro', () => {
    render(
      <BookCard
        book={book}
        uid="u1"
        tienePrestamoActivo={true}
        onSolicitar={noop}
        onDevolver={noop}
      />
    )
    expect(screen.getByText(/devuelve tu libro actual/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /solicitar préstamo/i })).toBeNull()
  })

  it('muestra mensaje de advertencia si el usuario alcanzó el límite de 3 solicitudes', () => {
    render(
      <BookCard
        book={book}
        uid="u1"
        limiteAlcanzado={true}
        onSolicitar={noop}
        onDevolver={noop}
      />
    )
    expect(screen.getByText(/límite alcanzado/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /solicitar préstamo/i })).toBeNull()
  })

  it('muestra "No disponible" a otro usuario si está prestado', () => {
    render(<BookCard book={{ ...book, estado: 'prestado', usuarioUid: 'u2' }} uid="u1" onSolicitar={noop} onDevolver={noop} />)
    expect(screen.getByText(/no disponible/i)).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('indica que el token fue enviado al correo institucional y pide credencial física UTSC cuando está en recolección', () => {
    render(
      <BookCard
        book={{ ...book, estado: 'recoleccion', usuarioUid: 'u1' }}
        uid="u1"
        onSolicitar={noop}
      />
    )
    expect(screen.getByText(/listo para recolección/i)).toBeInTheDocument()
    expect(screen.getByText(/token enviado a tu correo @virtual\.utsc\.edu\.mx/i)).toBeInTheDocument()
    expect(screen.getByText(/credencial física utsc/i)).toBeInTheDocument()
  })

  it('muestra "Devolver" al usuario que lo tiene prestado', () => {
    render(<BookCard book={{ ...book, estado: 'prestado', usuarioUid: 'u1' }} uid="u1" onSolicitar={noop} onDevolver={noop} />)
    expect(screen.getByRole('button', { name: /devolver/i })).toBeInTheDocument()
  })

  it('muestra "SOLICITANDO..." durante la operación de solicitar', () => {
    render(<BookCard book={book} uid="u1" onSolicitar={noop} busyAction="solicitar" />)
    expect(screen.getByRole('button', { name: /solicitando/i })).toBeDisabled()
  })

  it('muestra "CANCELANDO..." durante la operación de cancelar', () => {
    render(<BookCard book={book} uid="u1" tieneSolicitudPendiente={true} onCancelar={noop} busyAction="cancelar" />)
    expect(screen.getByRole('button', { name: /cancelando/i })).toBeDisabled()
  })
})
