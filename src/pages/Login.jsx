import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../config/firebase.js'
import { DOMINIO } from '../utils/validateRegistro.js'
import { isAdminEmail } from '../config/admin.js'

const inputClasses =
  'w-full rounded-lg bg-[#04120c] border border-emerald-500/15 text-slate-200 placeholder:text-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/60 transition-shadow'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Completa todos los campos.')
      return
    }
    if (!email.toLowerCase().endsWith(DOMINIO)) {
      setError(`Solo se permiten correos institucionales ${DOMINIO}.`)
      return
    }
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      // La cuenta de administrador es interna y no requiere verificar el correo
      if (isAdminEmail(user.email)) {
        navigate('/admin')
        return
      }
      if (!user.emailVerified) {
        await signOut(auth)
        setError('Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.')
        return
      }
      navigate('/biblioteca')
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No existe una cuenta con ese correo.')
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Contraseña incorrecta. Inténtalo de nuevo.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Espera un momento.')
      } else {
        setError('Credenciales inválidas. Verifica tu correo y contraseña.')
      }
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="bg-emerald-950/20 border border-emerald-500/10 rounded-2xl p-8 w-full max-w-sm"
      >
        <h1 className="font-display text-2xl font-bold text-white text-center">
          UTSC <span className="text-emerald-400">Salud</span>
        </h1>
        <p className="text-slate-400 text-sm text-center mt-1">Ingresa con tu correo institucional</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClasses}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClasses}
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            className="bg-emerald-400 hover:bg-emerald-300 active:scale-95 transition-all text-[#04120c] font-bold uppercase tracking-wide py-2.5 rounded-full"
          >
            Ingresar
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400 flex flex-col gap-2">
          <Link to="/registro" className="hover:text-emerald-400 transition-colors">¿No tienes cuenta? Regístrate aquí</Link>
          <Link to="/" className="hover:text-emerald-400 transition-colors">← Volver al inicio</Link>
        </div>
      </motion.div>
    </div>
  )
}
