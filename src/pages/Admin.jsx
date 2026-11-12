import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../config/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { isAdmin } from '../config/admin.js'
import Modal from '../components/admin/Modal.jsx'
import AgregarLibros from '../components/admin/AgregarLibros.jsx'
import SolicitudesLista from '../components/admin/SolicitudesLista.jsx'
import Estadisticas from '../components/admin/Estadisticas.jsx'
import {
  ESTADO_PRESTAMO,
  aprobarSolicitud,
  rechazarSolicitud,
  confirmarRecoleccion,
  cancelarRecoleccion,
  aprobarDevolucion,
  rechazarDevolucion,
} from '../services/prestamos.js'

const Icon = ({ d }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
)

const SECCIONES = [
  {
    id: 'agregar',
    titulo: 'Agregar Libros',
    descripcion: 'Cuestionario que genera el script e inyecta libros en Firebase.',
    icon: <Icon d={<><path d="M4 19.5V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-1.5Z" /><path d="M12 8v6M9 11h6" /></>} />,
  },
  {
    id: 'solicitudes',
    titulo: 'Autorizar Solicitudes de Libros',
    descripcion: 'Aparta el ejemplar y genera el token de recolección para el alumno.',
    icon: <Icon d={<><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>} />,
    contador: ESTADO_PRESTAMO.PENDIENTE,
  },
  {
    id: 'recolecciones',
    titulo: 'Entregar Libros (Recolección)',
    descripcion: 'Valida en ventanilla el token del alumno y su credencial física UTSC.',
    icon: <Icon d={<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M15 8h2M15 12h2M7 16h10" /></>} />,
    contador: ESTADO_PRESTAMO.RECOLECCION_PENDIENTE,
  },
  {
    id: 'devoluciones',
    titulo: 'Autorizar Devolución de Libros',
    descripcion: 'Confirma que el libro fue entregado para liberarlo en el catálogo.',
    icon: <Icon d={<><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>} />,
    contador: ESTADO_PRESTAMO.DEVOLUCION_PENDIENTE,
  },
  {
    id: 'estadisticas',
    titulo: 'Estadísticas',
    descripcion: 'Libros más solicitados, préstamos activos y más.',
    icon: <Icon d={<><path d="M3 3v18h18" /><path d="M7 15v3M12 10v8M17 6v12" /></>} />,
  },
]

function usePendientes(estado, enabled) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const q = query(collection(db, 'prestamos'), where('estado', '==', estado))
    return onSnapshot(q, (snap) => setN(snap.size), () => setN(0))
  }, [estado, enabled])
  return n
}

export default function Admin() {
  const { user } = useAuth()
  const admin = isAdmin(user)
  const [abierto, setAbierto] = useState(null)
  const pendientes = {
    [ESTADO_PRESTAMO.PENDIENTE]: usePendientes(ESTADO_PRESTAMO.PENDIENTE, admin),
    [ESTADO_PRESTAMO.RECOLECCION_PENDIENTE]: usePendientes(ESTADO_PRESTAMO.RECOLECCION_PENDIENTE, admin),
    [ESTADO_PRESTAMO.DEVOLUCION_PENDIENTE]: usePendientes(ESTADO_PRESTAMO.DEVOLUCION_PENDIENTE, admin),
  }

  if (!admin) return <Navigate to="/" replace />

  const seccion = SECCIONES.find((s) => s.id === abierto)
  const cerrar = () => setAbierto(null)

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 py-14">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-bold text-emerald-400">Panel de Administración</h1>
          <p className="mt-2 text-slate-400">Modera el catálogo y los préstamos de la Biblioteca UTSC Salud.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {SECCIONES.map((s, i) => {
            const count = s.contador ? pendientes[s.contador] : 0
            return (
              <motion.button
                key={s.id}
                onClick={() => setAbierto(s.id)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                className="relative text-left rounded-2xl border border-emerald-500/15 hover:border-emerald-400/40 bg-emerald-950/20 p-6 transition-colors"
              >
                {count > 0 && (
                  <span className="absolute top-4 right-4 min-w-[1.75rem] h-7 px-2 rounded-full bg-amber-400 text-[#04120c] text-sm font-bold flex items-center justify-center">
                    {count}
                  </span>
                )}
                <div className="h-12 w-12 rounded-xl bg-emerald-400/10 text-emerald-300 flex items-center justify-center mb-4">
                  {s.icon}
                </div>
                <h2 className="font-display text-lg font-bold text-white">{s.titulo}</h2>
                <p className="text-sm text-slate-400 mt-1">{s.descripcion}</p>
              </motion.button>
            )
          })}
        </div>
      </div>

      <Modal open={!!seccion} onClose={cerrar} title={seccion?.titulo} subtitle={seccion?.descripcion}>
        {abierto === 'agregar' && <AgregarLibros />}
        {abierto === 'solicitudes' && (
          <SolicitudesLista
            estado={ESTADO_PRESTAMO.PENDIENTE}
            campoFecha="fechaSolicitud"
            etiquetaFecha="Solicitado"
            onAutorizar={aprobarSolicitud}
            onRechazar={rechazarSolicitud}
            textoAutorizar="Apartar"
            vacio="No hay solicitudes de préstamo pendientes."
          />
        )}
        {abierto === 'recolecciones' && (
          <SolicitudesLista
            estado={ESTADO_PRESTAMO.RECOLECCION_PENDIENTE}
            campoFecha="fechaAprobacion"
            etiquetaFecha="Apartado"
            onAutorizar={confirmarRecoleccion}
            onRechazar={cancelarRecoleccion}
            textoAutorizar="Entregar Libro"
            textoRechazar="Cancelar Apartado"
            vacio="No hay libros pendientes de recolección en ventanilla."
          />
        )}
        {abierto === 'devoluciones' && (
          <SolicitudesLista
            estado={ESTADO_PRESTAMO.DEVOLUCION_PENDIENTE}
            campoFecha="fechaSolicitudDevolucion"
            etiquetaFecha="Devolución solicitada"
            onAutorizar={aprobarDevolucion}
            onRechazar={rechazarDevolucion}
            vacio="No hay devoluciones pendientes."
          />
        )}
        {abierto === 'estadisticas' && <Estadisticas />}
      </Modal>
    </div>
  )
}
