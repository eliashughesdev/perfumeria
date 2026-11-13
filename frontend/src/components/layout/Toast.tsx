import { CheckCircle2, ChevronRight } from 'lucide-react'
import { useEffect } from 'react'

interface ToastProps {
  message: string
  visible: boolean
  onClose: () => void
}

export function Toast({ message, visible, onClose }: ToastProps) {
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => {
      onClose()
    }, 3200)
    return () => clearTimeout(timer)
  }, [visible, onClose])

  if (!visible) return null

  return (
    <div
      id="toast-notification"
      className={`fixed top-20 right-5 z-[60] px-4 py-3 rounded-xl shadow-2xl border border-gold-400/40 flex items-center gap-3 text-xs max-w-sm transition-transform duration-300 ${visible ? 'translate-x-0' : 'translate-x-[150%]'} bg-plum-950 text-white no-print`}
    >
      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
