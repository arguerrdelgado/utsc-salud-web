// Cuenta con permisos de administrador (debe coincidir con firestore.rules).
// Es una cuenta interna creada desde la consola de Firebase: no requiere verificar el correo.
export const ADMIN_EMAIL = 'admin@virtual.utsc.edu.mx'

export const isAdminEmail = (email) => email?.toLowerCase() === ADMIN_EMAIL

export const isAdmin = (user) => !!user && isAdminEmail(user.email)
