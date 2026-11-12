import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'

const MAX_MENSAJE = 1000

const INFO_ITEMS = [
  { label: 'Ubicación', value: 'Universidad Tecnológica de Santa Catarina — Santa Catarina, Nuevo León, México' },
  { label: 'Sitio institucional', value: 'www.utsc.edu.mx', accent: true },
  { label: 'Tiempo de respuesta', value: '24 a 48 horas hábiles' },
  { label: 'Soporte técnico', accentTail: true },
]

const inputClasses =
  'w-full rounded-lg bg-[#04120c] border border-emerald-500/15 text-slate-200 placeholder:text-slate-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/60 transition-shadow'

const initialForm = { nombre: '', correo: '', asunto: '', mensaje: '', web: '' }

export default function Contacto() {
  const { user } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('idle') // idle | sending | sent | error | tooLong

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Honeypot: si un bot llenó este campo oculto, simulamos éxito sin registrar nada
    if (form.web.trim()) {
      setForm(initialForm)
      setStatus('sent')
      return
    }

    if (!form.nombre.trim() || !form.correo.trim() || !form.mensaje.trim()) {
      setStatus('error')
      return
    }
    if (form.mensaje.length > MAX_MENSAJE) {
      setStatus('tooLong')
      return
    }
    setStatus('sending')
    try {
      await addDoc(collection(db, 'mensajes_contacto'), {
        nombre: form.nombre.trim(),
        correo: form.correo.trim(),
        asunto: form.asunto.trim(),
        mensaje: form.mensaje.trim(),
        creado: serverTimestamp(),
      })
      setForm(initialForm)
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center px-4">
        <h1 className="font-display text-2xl font-bold text-white">Inicia sesión para contactarnos</h1>
        <p className="mt-3 text-slate-400 max-w-md">
          Debes iniciar sesión con tu cuenta institucional para enviar mensajes.
        </p>
        <Link
          to="/login"
          className="inline-block mt-6 bg-emerald-400 hover:bg-emerald-300 active:scale-95 transition-all text-[#04120c] font-bold uppercase tracking-wide px-7 py-3 rounded-full"
        >
          Iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-16">
      <div className="max-w-4xl mx-auto text-center mb-10">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl font-bold text-emerald-400"
        >
          Soporte y Contacto
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-2 text-slate-400"
        >
          ¿Tienes problemas con tu acceso o dudas sobre la plataforma? Escríbenos y te responderemos a la brevedad.
        </motion.p>
      </div>

      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-emerald-950/20 border border-emerald-500/10 rounded-2xl p-8 flex flex-col gap-5"
        >
          <div>
            <h2 className="font-display font-bold text-white text-lg mb-1">Estamos para ayudarte</h2>
            <p className="text-slate-400 text-sm">
              Usa el formulario para enviarnos tu mensaje. Tu consulta quedará registrada y un miembro del equipo te contactará pronto.
            </p>
          </div>

          {INFO_ITEMS.map((item) => (
            <div key={item.label}>
              <p className="font-semibold text-white text-sm">{item.label}</p>
              <p className={item.accent ? 'text-emerald-400 text-sm' : 'text-slate-400 text-sm'}>
                {item.accentTail ? (
                  <>
                    Disponible para usuarios con cuenta <span className="text-emerald-400">@virtual.utsc.edu.mx</span>
                  </>
                ) : (
                  item.value
                )}
              </p>
            </div>
          ))}

          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300 border border-emerald-500/30 rounded-full px-3 py-1">
              ODS 3 · Salud y Bienestar
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300 border border-emerald-500/30 rounded-full px-3 py-1">
              ODS 4 · Educación de Calidad
            </span>
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.18, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-emerald-950/20 border border-emerald-500/10 rounded-2xl p-8 flex flex-col gap-4"
        >
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Nombre completo</label>
            <input
              type="text"
              placeholder="Ej. María González"
              value={form.nombre}
              onChange={handleChange('nombre')}
              className={inputClasses}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Correo institucional</label>
            <input
              type="email"
              placeholder="Ej. usuario@virtual.utsc.edu.mx"
              value={form.correo}
              onChange={handleChange('correo')}
              className={inputClasses}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Asunto</label>
            <input
              type="text"
              placeholder="Ej. Problema al acceder a la biblioteca"
              value={form.asunto}
              onChange={handleChange('asunto')}
              className={inputClasses}
            />
          </div>
          {/* Honeypot anti-bots: campo invisible para humanos, los bots suelen llenarlo */}
          <input
            type="text"
            name="web"
            value={form.web}
            onChange={handleChange('web')}
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          <div>
            <label className="text-sm font-medium text-slate-300 mb-1 block">Mensaje</label>
            <textarea
              rows={5}
              maxLength={MAX_MENSAJE}
              placeholder="Describe tu consulta con el mayor detalle posible..."
              value={form.mensaje}
              onChange={handleChange('mensaje')}
              className={inputClasses}
            />
            <p className="text-slate-600 text-xs mt-1 text-right">{form.mensaje.length}/{MAX_MENSAJE}</p>
          </div>

          {status === 'error' && (
            <p className="text-red-400 text-xs">Por favor completa todos los campos.</p>
          )}
          {status === 'tooLong' && (
            <p className="text-red-400 text-xs">El mensaje no puede superar los {MAX_MENSAJE} caracteres.</p>
          )}
          {status === 'sent' && (
            <p className="text-emerald-400 text-xs">Mensaje enviado correctamente. ¡Gracias!</p>
          )}

          <button
            type="submit"
            disabled={status === 'sending'}
            className="mt-2 bg-emerald-400 hover:bg-emerald-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-[#04120c] font-bold uppercase tracking-wide px-4 py-3 rounded-full"
          >
            {status === 'sending' ? 'Enviando...' : 'Enviar mensaje'}
          </button>
        </motion.form>
      </div>
    </div>
  )
}
