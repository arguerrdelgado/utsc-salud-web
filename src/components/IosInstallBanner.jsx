import { useState, useEffect } from 'react'

const STORAGE_KEY = 'utsc_ios_pwa_dismissed'

export default function IosInstallBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed === 'true') return

    const ua = window.navigator.userAgent || ''
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)

    const isStandalone =
      window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches

    if (isIOSDevice && !isStandalone) {
      setVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Instalar aplicación en iOS"
      className="fixed bottom-24 left-4 right-4 z-50 max-w-md mx-auto bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-4 shadow-2xl text-slate-100"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src="/apple-touch-icon.png"
            alt="UTSC Salud"
            className="w-11 h-11 rounded-xl border border-emerald-500/30 shrink-0"
          />
          <div>
            <p className="text-sm font-bold text-white">Instalar UTSC Salud en tu iPhone</p>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Toca el botón{' '}
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                Compartir
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="inline"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </span>{' '}
              en Safari y selecciona <span className="font-semibold text-white">&ldquo;Agregar a pantalla de inicio&rdquo;</span>.
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          aria-label="Cerrar aviso"
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
