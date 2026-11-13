export const DOMINIO = '@virtual.utsc.edu.mx'

// Requisitos de la contraseña (se usan en la validación y en la lista visual del registro)
export const PASSWORD_RULES = [
  { id: 'length', label: 'Mínimo 8 caracteres', test: (p) => p.length >= 8 },
  { id: 'lower', label: 'Al menos una letra minúscula', test: (p) => /\p{Ll}/u.test(p) },
  { id: 'upper', label: 'Al menos una letra mayúscula', test: (p) => /\p{Lu}/u.test(p) },
  { id: 'number', label: 'Al menos un número', test: (p) => /\p{N}/u.test(p) },
  { id: 'symbol', label: 'Al menos un símbolo (!@#$%&*...)', test: (p) => /[^\p{L}\p{N}\s]/u.test(p) },
]

export function validatePassword(password) {
  const fallidas = PASSWORD_RULES.filter((r) => !r.test(password))
  if (fallidas.length === 0) return null
  return `La contraseña debe tener: ${fallidas.map((r) => r.label.toLowerCase()).join(', ')}.`
}

export function validateRegistro({ email, password, confirm, acepta }) {
  if (!email.toLowerCase().endsWith(DOMINIO)) {
    return `Solo se permiten correos institucionales ${DOMINIO}.`
  }
  const passwordError = validatePassword(password)
  if (passwordError) {
    return passwordError
  }
  if (password !== confirm) {
    return 'Las contraseñas no coinciden.'
  }
  if (!acepta) {
    return 'Debes aceptar el Aviso de Protección de Datos.'
  }
  return null
}
