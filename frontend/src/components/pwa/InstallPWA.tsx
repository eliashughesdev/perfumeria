import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const isIOSDevice = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export function InstallPWA() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(true)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSHelp, setShowIOSHelp] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    setIsStandalone(standalone)
    setIsIOS(isIOSDevice())

    const handlePrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }
    const handleInstalled = () => {
      setInstallEvent(null)
      setIsStandalone(true)
    }

    window.addEventListener('beforeinstallprompt', handlePrompt)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  if (isStandalone || (!installEvent && !isIOS)) return null

  const install = async () => {
    if (!installEvent) {
      setShowIOSHelp(true)
      return
    }
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') {
      setInstallEvent(null)
      setIsStandalone(true)
    }
  }

  return (
    <>
      <button
        onClick={install}
        className="p-2 rounded-xl bg-champagne-400 text-noir-950 hover:bg-champagne-300 transition"
        aria-label="Instalar aplicación en el móvil"
        title="Instalar app en el móvil"
      >
        <Download className="w-4 h-4" />
      </button>

      {showIOSHelp && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Instalar NURFA ESSENCI POS en iPhone/iPad</h3>
                <p className="mt-1 text-xs text-slate-500">Sigue estos pasos desde Safari:</p>
              </div>
              <button onClick={() => setShowIOSHelp(false)} className="p-1 text-slate-400" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-champagne-100 font-bold">1</span>
                Toca el botón Compartir <Share className="w-4 h-4 text-noir-800" />
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-champagne-100 font-bold">2</span>
                Elige “Añadir a pantalla de inicio”.
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-champagne-100 font-bold">3</span>
                Confirma con “Añadir”.
              </li>
            </ol>
            <button
              onClick={() => setShowIOSHelp(false)}
              className="w-full rounded-xl bg-noir-950 py-2.5 text-xs font-bold text-white"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  )
}
