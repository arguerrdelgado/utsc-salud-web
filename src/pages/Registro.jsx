import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../config/firebase.js'
import { sendWelcomeEmail } from '../config/emailjs.js'
import { validateRegistro, PASSWORD_RULES } from '../utils/validateRegistro.js'

const inputClasses =
  'w-full rounded-lg bg-[#04120c] border border-emerald-500/15 text-slate-200 placeholder:text-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/60 transition-shadow'

export default function Registro() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [acepta, setAcepta] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const validationError = validateRegistro({ email, password, confirm, acepta })
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)

      // Auditoría del alta: respaldo de que se aceptó el Aviso de Protección de Datos
      try {
        await addDoc(collection(db, 'usuarios'), {
          correo: email,
          fechaRegistro: serverTimestamp(),
          avisoAceptado: true,
        })
      } catch {
        // el registro continua aunque falle el respaldo de auditoria
      }

      await sendEmailVerification(user)
      try {
        await sendWelcomeEmail({ toEmail: email, toName: email.split('@')[0] })
      } catch {
        // el registro continua aunque falle el envio del correo
      }

      // La sesión se cierra hasta que el usuario confirme su correo
      await signOut(auth)
      setSent(true)
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Ya existe una cuenta con ese correo.')
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña es muy débil. Revisa los requisitos.')
      } else {
        setError('Ocurrió un error. Intenta de nuevo.')
      }
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="bg-emerald-950/20 border border-emerald-500/10 rounded-2xl p-8 w-full max-w-sm"
      >
        <h1 className="font-display text-2xl font-bold text-white text-center">Registrar Cuenta</h1>

        {sent ? (
          <p className="text-slate-300 text-sm text-center mt-4 leading-relaxed">
            Cuenta creada con éxito. Enviamos un enlace de confirmación a tu correo.
            También hemos adjuntado nuestro Aviso de Protección de Datos.
            Confírmalo antes de iniciar sesión.
          </p>
        ) : (
        <>
        <p className="text-slate-400 text-sm text-center mt-1">Regístrate usando tu correo institucional de la UTSC.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <input
            type="email"
            placeholder="Correo institucional"
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
          <ul className="-mt-2 grid grid-cols-1 gap-1 text-xs" aria-label="Requisitos de la contraseña">
            {PASSWORD_RULES.map((r) => {
              const ok = r.test(password)
              return (
                <li key={r.id} className={`flex items-center gap-2 transition-colors ${ok ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className={`h-4 w-4 rounded-full border flex items-center justify-center text-[10px] ${ok ? 'border-emerald-400 bg-emerald-400/20' : 'border-slate-600'}`}>
                    {ok ? '✓' : ''}
                  </span>
                  {r.label}
                </li>
              )
            })}
          </ul>
          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClasses}
          />
          <label className="flex items-start gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-0.5 accent-emerald-400" />
            Acepto el <Link to="/aviso" className="text-emerald-400 underline">Aviso de Protección de Datos</Link>
          </label>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            className="bg-emerald-400 hover:bg-emerald-300 active:scale-95 transition-all text-[#04120c] font-bold uppercase tracking-wide py-2.5 rounded-full"
          >
            Registrarse
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400 flex flex-col gap-2">
          <Link to="/login" className="hover:text-emerald-400 transition-colors">¿Ya tienes cuenta? Inicia sesión aquí</Link>
          <Link to="/" className="hover:text-emerald-400 transition-colors">← Volver al inicio</Link>
        </div>
        </>
        )}
      </motion.div>
    </div>
  )
}
