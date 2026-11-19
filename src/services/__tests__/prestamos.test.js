import { describe, it, expect, vi } from 'vitest'

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  runTransaction: vi.fn(),
  writeBatch: vi.fn(),
  serverTimestamp: vi.fn(),
  deleteField: vi.fn(),
}))

vi.mock('../../config/firebase.js', () => ({ db: {}, auth: {} }))
vi.mock('../../config/emailjs.js', () => ({
  sendLoanRequestEmail: vi.fn(),
  sendPickupTokenEmail: vi.fn(),
}))

import {
  generarTokenRecoleccion,
  validarTokenRecoleccion,
  confirmarRecoleccion,
} from '../prestamos.js'

describe('prestamos service helpers', () => {
  it('genera tokens con formato UTSC-XXXX', () => {
    const token = generarTokenRecoleccion()
    expect(token).toMatch(/^UTSC-\d{4}$/)
  })

  it('valida tokens completos, sin prefijo o con espacios/minúsculas', () => {
    expect(validarTokenRecoleccion('UTSC-4821', 'UTSC-4821')).toBe(true)
    expect(validarTokenRecoleccion(' utsc-4821 ', 'UTSC-4821')).toBe(true)
    expect(validarTokenRecoleccion('4821', 'UTSC-4821')).toBe(true)
  })

  it('rechaza tokens incorrectos, vacíos o sin valor esperado', () => {
    expect(validarTokenRecoleccion('9999', 'UTSC-4821')).toBe(false)
    expect(validarTokenRecoleccion('', 'UTSC-4821')).toBe(false)
    expect(validarTokenRecoleccion('UTSC-4821', '')).toBe(false)
  })

  it('exige verificar la credencial física UTSC antes de entregar', async () => {
    await expect(
      confirmarRecoleccion(
        { id: 'p1', libroId: 'l1' },
        { tokenIngresado: 'UTSC-4821', credencialVerificada: false },
      ),
    ).rejects.toThrow(/credencial física utsc/i)
  })

  it('exige ingresar el token de recolección cuando falta', async () => {
    await expect(
      confirmarRecoleccion(
        { id: 'p1', libroId: 'l1' },
        { tokenIngresado: '   ', credencialVerificada: true },
      ),
    ).rejects.toThrow(/token de recolección/i)
  })
})
