import { Menu, LogOut, Moon, Sun, Wifi } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { InstallPWA } from '@/components/pwa/InstallPWA'

export function Header() {
  const { usuario, logout, hasRole } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="bg-noir-950 text-cream h-16 px-4 lg:px-6 flex items-center justify-between shrink-0 border-b border-noir-800 shadow-md z-20">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('nurfa:toggle-sidebar'))}
          className="lg:hidden p-2 rounded-lg hover:bg-noir-800 text-champagne-300"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>
        <img
          src="/logo.jpeg"
          alt="Nurfa Essencial Perfumería"
          className="w-10 h-10 rounded-xl object-cover ring-1 ring-champagne-400/50 shadow-inner"
        />
        <div className="min-w-0">
          <h1 className="font-serif text-base lg:text-lg font-bold tracking-[0.18em] text-champagne-200 leading-none whitespace-nowrap">
            NURFA ESSENCIAL
          </h1>
          <span className="text-[10px] text-noir-300 uppercase tracking-[0.32em]">Perfumería</span>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <div className="cursor-default hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] font-medium">
          <Wifi className="w-3.5 h-3.5" />
          <span>Sesión segura</span>
        </div>

        <InstallPWA />

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-noir-900 border border-noir-800 text-champagne-300 hover:text-champagne-100 hover:bg-noir-800 transition"
          aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="hidden sm:flex items-center bg-noir-900 border border-noir-800 rounded-xl p-1 text-[11px]">
          <span className="hidden md:inline text-noir-300 px-2">Rol</span>
          <span className={`px-2.5 py-1 rounded-lg font-semibold ${hasRole('ROLE_ADMIN') ? 'bg-champagne-400 text-noir-950' : 'text-champagne-200'}`}>
            {hasRole('ROLE_ADMIN') ? 'Administradora' : 'Cajero'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 pl-2 border-l border-noir-800">
          <div className="w-8 h-8 rounded-full bg-noir-800 border border-champagne-400/40 flex items-center justify-center text-champagne-300 font-bold text-xs">
            {usuario?.nombre?.split(' ').map((n) => n[0]).slice(0, 2).join('') || 'NU'}
          </div>
          <div className="hidden md:block text-left leading-tight">
            <p className="text-xs font-semibold text-cream">{usuario?.nombre || 'Nurfa'}</p>
            <p className="text-[10px] text-champagne-400">{usuario?.rol === 'ROLE_ADMIN' ? 'Administración' : 'Caja / POS'}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2 md:px-3 md:py-1.5 rounded-lg bg-noir-900/60 hover:bg-noir-800 text-[11px] font-medium text-champagne-300 border border-noir-800/60 transition flex items-center gap-2"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Salir</span>
        </button>
      </div>
    </header>
  )
}
