import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'
import { isAdmin } from '../config/admin.js'
import { useScrollDirection } from '../hooks/useScrollDirection.js'

export default function BottomNav() {
  const { user } = useAuth()
  const location = useLocation()
  const { showBottom } = useScrollDirection()
  const esAdmin = isAdmin(user)

  const tabs = [
    {
      to: '/',
      label: 'Inicio',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
          <path d="M9 21v-7h6v7" />
        </svg>
      ),
    },
    {
      to: '/biblioteca',
      label: 'Biblioteca',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      to: '/contacto',
      label: 'Contacto',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    esAdmin
      ? {
          to: '/admin',
          label: 'Admin',
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          ),
        }
      : {
          to: '/aviso',
          label: 'Aviso',
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          ),
        },
  ]

  const getActiveIndex = () => {
    const path = location.pathname
    if (path === '/') return 0
    if (path.startsWith('/biblioteca')) return 1
    if (path.startsWith('/contacto')) return 2
    if (esAdmin && path.startsWith('/admin')) return 3
    if (!esAdmin && (path.startsWith('/aviso') || path.startsWith('/terminos'))) return 3
    return 0
  }

  const activeIndex = getActiveIndex()

  return (
    <nav
      aria-label="Navegación móvil"
      className={`fixed bottom-4 left-4 right-4 z-50 md:hidden max-w-md mx-auto transition-transform duration-300 ease-in-out select-none ${
        showBottom ? 'translate-y-0' : 'translate-y-28 pointer-events-none'
      }`}
    >
      <div className="bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.18)] border border-emerald-900/10 flex items-center justify-around h-16 relative overflow-hidden px-1">
        {tabs.map((tab, idx) => {
          const isActive = idx === activeIndex

          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-label={tab.label}
              className="flex-1 h-full flex flex-col items-center justify-center gap-1 relative py-1 active:scale-95 transition-transform"
            >
              <div
                className={`flex flex-col items-center gap-1 transition-colors duration-200 ${
                  isActive
                    ? 'text-emerald-500'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.icon}
                <span
                  className={`text-[10px] tracking-tight ${
                    isActive ? 'font-bold text-emerald-600' : 'font-semibold text-slate-500'
                  }`}
                >
                  {tab.label}
                </span>
              </div>

              {/* Indicador de barra activa inferior con resplandor (igual a la referencia) */}
              {isActive && (
                <motion.div
                  layoutId="modern-nav-indicator"
                  className="absolute bottom-0 left-3 right-3 h-1 bg-emerald-500 rounded-t-full shadow-[0_-3px_10px_rgba(16,185,129,0.55)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
