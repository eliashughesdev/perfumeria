import { Menu, Lock, Sparkles, CreditCard, Banknote, Smartphone, Receipt } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function Header() {
  const { usuario, logout, hasRole } = useAuth()

  const handleRoleSwitch = (rol: string) => {
    // En producción esto se maneja con JWT real del backend
    // Aquí simulamos el cambio de rol para el prototipo
    window.dispatchEvent(new CustomEvent('role-change', { detail: { rol } }))
  }

  return (
    <header className="bg-plum-950 text-white h-16 px-4 lg:px-6 flex items-center justify-between shrink-0 border-b border-plum-800 shadow-md z-20">
      <div className="flex items-center gap-3">
        <button className="lg:hidden p-2 rounded-lg hover:bg-plum-800 text-gold-400" aria-label="Menú">
          <Menu className="w-6 h-6" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-plum-950 shadow-inner">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-serif text-lg lg:text-xl font-bold tracking-wide text-gold-200 leading-none">L'ESSENCE</h1>
          <span className="text-[11px] text-plum-200 uppercase tracking-widest">Perfumería & Boutique</span>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-5">
        <div
          id="register-status-badge"
          className="cursor-pointer hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium hover:bg-emerald-500/25 transition"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Caja Abierta ($150.00)</span>
        </div>

        <div className="flex items-center bg-plum-900 border border-plum-800 rounded-xl p-1 text-xs">
          <span className="hidden md:inline text-plum-200 px-2">Rol RBAC:</span>
          <button
            onClick={() => handleRoleSwitch('ROLE_ADMIN')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${hasRole('ROLE_ADMIN') ? 'bg-gold-400 text-plum-950 shadow' : 'text-plum-200 hover:text-white'}`}
          >
            Admin
          </button>
          <button
            onClick={() => handleRoleSwitch('ROLE_CAJERO')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${hasRole('ROLE_CAJERO') ? 'bg-gold-400 text-plum-950 shadow' : 'text-plum-200 hover:text-white'}`}
          >
            Cajero
          </button>
        </div>

        <div className="flex items-center gap-2.5 pl-2 border-l border-plum-800">
          <div className="w-8 h-8 rounded-full bg-plum-800 border border-gold-400/50 flex items-center justify-center text-gold-300 font-bold text-xs">
            {usuario?.nombre?.split(' ').map((n) => n[0]).join('') || 'AG'}
          </div>
          <div className="hidden md:block text-left leading-tight">
            <p className="text-xs font-semibold text-white">{usuario?.nombre || 'Ana Gómez'}</p>
            <p className="text-[11px] text-gold-400">{usuario?.rol === 'ROLE_ADMIN' ? 'Administradora' : 'Cajero POS'}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-plum-900/50 hover:bg-plum-900/80 text-xs font-medium text-gold-300 border border-plum-800/50 transition"
        >
          <CreditCard className="w-3.5 h-3.5" /> Salir
        </button>
      </div>
    </header>
  )
}
