import { useMemo, useState } from 'react'
import { CATEGORIAS } from '../../data/categorias.js'
import { generarScriptLibros } from '../../utils/generarScript.js'
import { insertarLibros } from '../../services/prestamos.js'

const inputClasses =
  'w-full rounded-lg bg-[#04120c] border border-emerald-500/15 text-slate-200 placeholder:text-slate-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/60 transition-shadow'

const VACIO = { titulo: '', autor: '', categoria: CATEGORIAS[0], resumen: '', editorial: '', isbn: '', portada: '' }

const CAMPOS = [
  { name: 'titulo', label: 'Título', placeholder: 'Manual de Primeros Auxilios', required: true },
  { name: 'autor', label: 'Autor', placeholder: 'Dra. Elena Cavazos', required: true },
  { name: 'editorial', label: 'Editorial', placeholder: 'Editorial UTSC' },
  { name: 'isbn', label: 'ISBN', placeholder: '978-607-8000-01-1' },
  { name: 'portada', label: 'URL de portada', placeholder: 'https://...', type: 'url', full: true },
]

export default function AgregarLibros() {
  const [form, setForm] = useState(VACIO)
  const [cola, setCola] = useState([])
  const [error, setError] = useState('')
  const [estado, setEstado] = useState(null) // { tipo, texto }
  const [enviando, setEnviando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const script = useMemo(() => (cola.length ? generarScriptLibros(cola) : ''), [cola])

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }))

  const agregarALista = (e) => {
    e.preventDefault()
    setError('')
    setEstado(null)
    const libro = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]))
    if (!libro.titulo || !libro.autor || !libro.resumen) {
      setError('Título, autor y resumen son obligatorios.')
      return
    }
    if (libro.portada && !/^https?:\/\//i.test(libro.portada)) {
      setError('La URL de portada debe iniciar con http:// o https://')
      return
    }
    if (!libro.portada) libro.portada = `https://picsum.photos/seed/${encodeURIComponent(libro.titulo)}/300/400`
    setCola((c) => [...c, libro])
    setForm({ ...VACIO, categoria: form.categoria })
  }

  const quitar = (i) => setCola((c) => c.filter((_, idx) => idx !== i))

  const copiar = async () => {
    await navigator.clipboard.writeText(script)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const descargar = () => {
    const blob = new Blob([script], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'agregar-libros.mjs'
    a.click()
    URL.revokeObjectURL(url)
  }

  const inyectar = async () => {
    setEnviando(true)
    setEstado(null)
    try {
      await insertarLibros(cola)
      setEstado({ tipo: 'ok', texto: `${cola.length} libro(s) agregados a Firebase. Ya aparecen en el catálogo.` })
      setCola([])
    } catch (err) {
      setEstado({
        tipo: 'error',
        texto: err.code === 'permission-denied'
          ? 'Firebase rechazó la escritura. Verifica que las reglas de Firestore estén publicadas.'
          : 'No se pudieron agregar los libros. Intenta de nuevo.',
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Cuestionario */}
      <form onSubmit={agregarALista} className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-400">1. Datos del libro</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {CAMPOS.map((c) => (
            <label key={c.name} className={`flex flex-col gap-1 text-xs text-slate-400 ${c.full ? 'sm:col-span-2' : ''}`}>
              {c.label}{c.required && ' *'}
              <input type={c.type || 'text'} value={form[c.name]} onChange={set(c.name)} placeholder={c.placeholder} className={inputClasses} />
            </label>
          ))}
          <label className="flex flex-col gap-1 text-xs text-slate-400 sm:col-span-2">
            Categoría *
            <select value={form.categoria} onChange={set('categoria')} className={`${inputClasses} cursor-pointer`}>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400 sm:col-span-2">
            Resumen *
            <textarea rows={3} value={form.resumen} onChange={set('resumen')} placeholder="Breve descripción del contenido..." className={`${inputClasses} resize-none`} />
          </label>
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button type="submit" className="self-start px-5 py-2 rounded-full text-xs font-bold uppercase border border-emerald-400/50 text-emerald-300 hover:bg-emerald-400/10 transition-colors">
          + Agregar a la lista
        </button>

        {cola.length > 0 && (
          <div className="mt-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-400 mb-2">Libros en la lista ({cola.length})</h3>
            <ul className="flex flex-col gap-1.5">
              {cola.map((l, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-emerald-950/40 border border-emerald-500/10 px-3 py-2 text-sm">
                  <span className="truncate text-slate-200">{l.titulo} <span className="text-slate-500">— {l.autor}</span></span>
                  <button type="button" onClick={() => quitar(i)} className="text-slate-500 hover:text-red-400" aria-label={`Quitar ${l.titulo}`}>✕</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>

      {/* Script generado */}
      <div className="flex flex-col gap-3 min-w-0">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-400">2. Script para Firebase</h3>
        {cola.length === 0 ? (
          <div className="flex-1 min-h-[200px] flex items-center justify-center rounded-xl border border-dashed border-emerald-500/20 text-sm text-slate-500 text-center px-6">
            Agrega al menos un libro para generar el script.
          </div>
        ) : (
          <>
            <pre className="flex-1 max-h-80 overflow-auto rounded-xl bg-black/50 border border-emerald-500/10 p-3 text-[11px] leading-relaxed text-emerald-100 font-mono">{script}</pre>
            <div className="flex flex-wrap gap-2">
              <button onClick={copiar} className="px-4 py-1.5 rounded-full text-xs font-bold uppercase border border-emerald-500/30 text-slate-300 hover:bg-emerald-500/10">
                {copiado ? '¡Copiado!' : 'Copiar'}
              </button>
              <button onClick={descargar} className="px-4 py-1.5 rounded-full text-xs font-bold uppercase border border-emerald-500/30 text-slate-300 hover:bg-emerald-500/10">
                Descargar .mjs
              </button>
              <button
                onClick={inyectar}
                disabled={enviando}
                className="ml-auto px-5 py-1.5 rounded-full text-xs font-bold uppercase bg-emerald-400 hover:bg-emerald-300 text-[#04120c] disabled:opacity-50"
              >
                {enviando ? 'Inyectando...' : `Inyectar en Firebase (${cola.length})`}
              </button>
            </div>
          </>
        )}
        {estado && (
          <p className={`text-sm ${estado.tipo === 'ok' ? 'text-emerald-300' : 'text-red-400'}`}>{estado.texto}</p>
        )}
      </div>
    </div>
  )
}
