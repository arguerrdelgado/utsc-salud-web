import { Link } from 'react-router-dom'

const FOOTER_LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/biblioteca', label: 'Biblioteca' },
  { to: '/contacto', label: 'Contacto' },
  { to: '/aviso', label: 'Aviso de Protección de Datos' },
  { to: '/terminos', label: 'Términos y Condiciones' },
]

export default function Footer() {
  return (
    <footer className="border-t border-emerald-500/10 py-8">
      <div className="max-w-4xl mx-auto px-4 flex flex-col items-center gap-4 text-center">
        <p className="text-slate-500 text-sm">
          © {new Date().getFullYear()} <span className="text-slate-300 font-semibold">UTSC Salud</span> — Proyecto de Biblioteca Digital Universitaria.
        </p>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          {FOOTER_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="text-slate-500 hover:text-emerald-400 transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
