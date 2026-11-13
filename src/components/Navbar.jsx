import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { signOut } from 'firebase/auth'
import { auth } from '../config/firebase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { isAdmin } from '../config/admin.js'
import { useScrollDirection } from '../hooks/useScrollDirection.js'

const LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/biblioteca', label: 'Biblioteca' },
  { to: '/contacto', label: 'Contacto' },
]

export default function Navbar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { showTop } = useScrollDirection()
  const links = isAdmin(user) ? [...LINKS, { to: '/admin', label: 'Admin' }] : LINKS

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  return (
    <header className={`sticky top-0 z-50 bg-emerald-50 border-b border-emerald-900/10 transition-transform duration-300 ease-in-out ${
      showTop ? 'translate-y-0' : '-translate-y-full md:translate-y-0'
    }`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="font-display text-xl font-bold tracking-wide text-slate-900 transition-transform hover:scale-[1.03]">
          UTSC <span className="text-emerald-600">Salud</span>
        </Link>

        <nav className="hidden md:flex gap-1 text-sm font-medium">
          {links.map((link) => {
            const active = location.pathname === link.to
            return (
              <Link key={link.to} to={link.to} className="relative px-3 py-2">
                <span className={active ? 'text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900 transition-colors'}>
                  {link.label}
                </span>
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute left-3 right-3 -bottom-0.5 h-0.5 bg-emerald-600 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline text-slate-500">
            Usuario: <span className="text-slate-700">{user ? user.email : 'Invitado'}</span>
          </span>
          {user ? (
            <button
              onClick={handleLogout}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all px-4 py-1.5 rounded-full font-bold text-white"
            >
              SALIR
            </button>
          ) : (
            <Link
              to="/login"
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all px-4 py-1.5 rounded-full font-bold text-white inline-block"
            >
              INGRESAR
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
