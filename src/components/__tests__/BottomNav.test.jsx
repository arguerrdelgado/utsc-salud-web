import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BottomNav from '../BottomNav.jsx'

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(() => ({ user: null })),
}))

vi.mock('../../config/admin.js', () => ({
  isAdmin: vi.fn((user) => user?.email === 'admin@utsc.edu.mx'),
}))

describe('BottomNav', () => {
  it('renderiza Inicio, Biblioteca, Contacto y Aviso para usuarios regulares', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNav />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: /inicio/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /biblioteca/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /contacto/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /aviso/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /admin/i })).toBeNull()
  })

  it('renderiza Admin en lugar de Aviso si el usuario es administrador', async () => {
    const { useAuth } = await import('../../context/AuthContext.jsx')
    useAuth.mockReturnValue({ user: { email: 'admin@utsc.edu.mx' } })

    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNav />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /aviso/i })).toBeNull()
  })
})
