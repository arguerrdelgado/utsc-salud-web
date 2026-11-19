import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar.jsx'
import BottomNav from './components/BottomNav.jsx'
import Footer from './components/Footer.jsx'
import IosInstallBanner from './components/IosInstallBanner.jsx'

const Inicio = lazy(() => import('./pages/Inicio.jsx'))
const Biblioteca = lazy(() => import('./pages/Biblioteca.jsx'))
const Contacto = lazy(() => import('./pages/Contacto.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Registro = lazy(() => import('./pages/Registro.jsx'))
const Aviso = lazy(() => import('./pages/Aviso.jsx'))
const Terminos = lazy(() => import('./pages/Terminos.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

function Page({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function PageFallback() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center text-sm text-emerald-300/70">
      Cargando...
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen relative pb-24 md:pb-0">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.16), transparent),' +
            'radial-gradient(ellipse 60% 40% at 90% 15%, rgba(13,42,28,0.5), transparent)',
        }}
      />
      <Navbar />
      <Suspense fallback={<PageFallback />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Page><Inicio /></Page>} />
            <Route path="/biblioteca" element={<Page><Biblioteca /></Page>} />
            <Route path="/contacto" element={<Page><Contacto /></Page>} />
            <Route path="/login" element={<Page><Login /></Page>} />
            <Route path="/registro" element={<Page><Registro /></Page>} />
            <Route path="/aviso" element={<Page><Aviso /></Page>} />
            <Route path="/terminos" element={<Page><Terminos /></Page>} />
            <Route path="/admin" element={<Page><Admin /></Page>} />
          </Routes>
        </AnimatePresence>
      </Suspense>
      <Footer />
      <IosInstallBanner />
      <BottomNav />
    </div>
  )
}
