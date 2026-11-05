import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../config/firebase.js'

const formatFecha = (ts) =>
  ts?.toDate ? ts.toDate().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

/**
 * Lista en tiempo real de préstamos con un estado dado.
 * Soporta solicitudes iniciales, validación en ventanilla (token + credencial UTSC) y devoluciones.
 */
export default function SolicitudesLista({
  estado,
  campoFecha,
  etiquetaFecha,
  onAutorizar,
  onRechazar,
  vacio,
  textoAutorizar = 'Autorizar',
  textoRechazar = 'Rechazar',
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const [alumnosConLibro, setAlumnosConLibro] = useState(new Set())
  const [tokensInput, setTokensInput] = useState({})
  const [credencialCheck, setCredencialCheck] = useState({})

  const esModoRecoleccion = estado === 'recoleccion_pendiente'

  // Escuchar solicitudes con el estado solicitado
  useEffect(() => {
    const q = query(collection(db, 'prestamos'), where('estado', '==', estado))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        docs.sort((a, b) => (a[campoFecha]?.toMillis?.() ?? 0) - (b[campoFecha]?.toMillis?.() ?? 0))
        setItems(docs)
        setLoading(false)
      },
      () => {
        setError('No se pudieron cargar las solicitudes. Verifica las reglas de Firestore.')
        setLoading(false)
      },
    )
    return unsub
  }, [estado, campoFecha])

  // Escuchar qué alumnos tienen actualmente 1 libro apartado o prestado
  useEffect(() => {
    if (estado !== 'pendiente') return

    const unsubPrestamosActivos = onSnapshot(
      collection(db, 'prestamos'),
      (snap) => {
        const setConLibro = new Set()
        snap.docs.forEach((d) => {
          const data = d.data()
          if (
            data.estado === 'recoleccion_pendiente' ||
            data.estado === 'activo' ||
            data.estado === 'devolucion_pendiente'
          ) {
            if (data.uid) setConLibro.add(data.uid)
          }
        })
        setAlumnosConLibro(setConLibro)
      },
      () => setAlumnosConLibro(new Set())
    )

    return unsubPrestamosActivos
  }, [estado])

  const ejecutar = async (item, accion, payload) => {
    setBusy(item.id)
    setError('')
    try {
      await accion(item, payload)
    } catch (err) {
      setError(err?.message || 'No se pudo completar la operación. Intenta de nuevo.')
    } finally {
      setBusy(null)
    }
  }

  if (loading) return <p className="text-slate-400 text-sm">Cargando...</p>

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-200">
          {error}
        </div>
      )}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">✓</p>
          <p className="text-slate-400 text-sm">{vacio}</p>
        </div>
      ) : (
        items.map((item) => {
          const estaPausada = estado === 'pendiente' && alumnosConLibro.has(item.uid)
          const tokenVal = tokensInput[item.id] ?? ''
          const credencialOk = !!credencialCheck[item.id]

          return (
            <div
              key={item.id}
              className={`flex flex-col gap-3 rounded-xl border px-4 py-3 transition-colors ${
                estaPausada
                  ? 'border-amber-500/25 bg-amber-950/20'
                  : 'border-emerald-500/15 bg-emerald-950/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white truncate">{item.libroTitulo}</p>
                    {estaPausada && (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide bg-amber-400/15 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                        En pausa · Alumno ya tiene 1 libro
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 truncate">{item.correo}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {etiquetaFecha}: {formatFecha(item[campoFecha])}
                  </p>
                </div>

                {!esModoRecoleccion && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => ejecutar(item, onRechazar)}
                      disabled={busy === item.id}
                      className="px-4 py-1.5 rounded-full text-xs font-bold uppercase border border-red-400/40 text-red-300 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                    >
                      {textoRechazar}
                    </button>
                    <button
                      onClick={() => ejecutar(item, onAutorizar)}
                      disabled={busy === item.id || estaPausada}
                      title={estaPausada ? 'El alumno ya tiene 1 libro asignado' : textoAutorizar}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        estaPausada
                          ? 'border border-amber-500/30 bg-amber-950/40 text-amber-300'
                          : 'bg-emerald-400 hover:bg-emerald-300 text-[#04120c]'
                      }`}
                    >
                      {busy === item.id ? '...' : textoAutorizar}
                    </button>
                  </div>
                )}
              </div>

              {esModoRecoleccion && (
                <div className="border-t border-emerald-500/15 pt-3 flex flex-col gap-3">
                  <div className="grid sm:grid-cols-2 gap-3 items-center">
                    <input
                      type="text"
                      value={tokenVal}
                      onChange={(e) =>
                        setTokensInput((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="Token del alumno (ej. UTSC-4821)"
                      className="rounded-lg bg-black/40 border border-emerald-500/20 text-white placeholder:text-slate-500 px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                    />
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={credencialOk}
                        onChange={(e) =>
                          setCredencialCheck((prev) => ({ ...prev, [item.id]: e.target.checked }))
                        }
                        className="h-4 w-4 rounded border-emerald-500/40 accent-emerald-400"
                      />
                      <span>Credencial física UTSC verificada (foto y titular coinciden)</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => ejecutar(item, onRechazar)}
                      disabled={busy === item.id}
                      className="px-4 py-1.5 rounded-full text-xs font-bold uppercase border border-red-400/40 text-red-300 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                    >
                      {textoRechazar}
                    </button>
                    <button
                      onClick={() =>
                        ejecutar(item, onAutorizar, {
                          tokenIngresado: tokenVal,
                          credencialVerificada: credencialOk,
                        })
                      }
                      disabled={busy === item.id}
                      className="px-4 py-1.5 rounded-full text-xs font-bold uppercase bg-emerald-400 hover:bg-emerald-300 text-[#04120c] transition-colors disabled:opacity-40"
                    >
                      {busy === item.id ? '...' : textoAutorizar}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
