import { describe, it, expect } from 'vitest'
import { validateRegistro, validatePassword, DOMINIO } from '../validateRegistro.js'

const base = { email: `alumno${DOMINIO}`, password: 'Salud#2026', confirm: 'Salud#2026', acepta: true }

describe('validateRegistro', () => {
  it('pasa con datos validos', () => {
    expect(validateRegistro(base)).toBeNull()
  })

  it('rechaza correo no institucional', () => {
    expect(validateRegistro({ ...base, email: 'alumno@gmail.com' })).toMatch(/institucional/)
  })

  it('rechaza contraseña corta', () => {
    expect(validateRegistro({ ...base, password: 'Ab#1', confirm: 'Ab#1' })).toMatch(/8 caracteres/)
  })

  it('rechaza contraseñas que no coinciden', () => {
    expect(validateRegistro({ ...base, confirm: 'Otra#2026' })).toMatch(/no coinciden/)
  })

  it('rechaza si no acepta el aviso', () => {
    expect(validateRegistro({ ...base, acepta: false })).toMatch(/Aviso de Protección/)
  })
})

describe('validatePassword', () => {
  it('acepta una contraseña que cumple todo', () => {
    expect(validatePassword('Salud#2026')).toBeNull()
  })

  it('exige minúscula', () => {
    expect(validatePassword('SALUD#2026')).toMatch(/minúscula/)
  })

  it('exige mayúscula', () => {
    expect(validatePassword('salud#2026')).toMatch(/mayúscula/)
  })

  it('exige número', () => {
    expect(validatePassword('Salud#Utsc')).toMatch(/número/)
  })

  it('exige símbolo', () => {
    expect(validatePassword('Salud2026')).toMatch(/símbolo/)
  })
})
