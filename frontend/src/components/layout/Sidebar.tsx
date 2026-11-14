import { ShoppingBag, Wallet, Package, BarChart3, ShieldCheck, Lock, Menu, X, SlidersHorizontal, ReceiptText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { PermisoClave } from '@/types'

interface NavItem {
  key: string
  label: string
  icon: React.ElementType
  permission?: PermisoClave
}

const NAV_ITEMS: NavItem[] = [
  { key: 'pos', label: 'Punto de Venta', icon: ShoppingBag },
  { key: 'caja', label: 'Control de Caja', icon: Wallet },
  { key: 'inventario', label: 'Inventario', icon: Package },
  { key: 'facturas', label: 'Facturas', icon: ReceiptText, permission: 'factura.editar' },
  { key: 'contabilidad', label: 'Contabilidad', icon: BarChart3, permission: 'contabilidad.ver' },
  { key: 'usuarios', label: 'Usuarios & RBAC', icon: ShieldCheck, permission: 'usuarios.gestionar' },
  { key: 'configuracion', label: 'Configuración', icon: SlidersHorizontal, permission: 'factura.configurar' },
]

interface SidebarProps {
  currentView: string
  setCurrentView: (key: string) => void
  lowStockCount: number
}

export function Sidebar({ currentView, setCurrentView, lowStockCount }: SidebarProps) {
  const { hasPermission, usuario } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleToggle = () => setMobileOpen((open) => !open)
    window.addEventListener('nurfa:toggle-sidebar', handleToggle)
    return () => window.removeEventListener('nurfa:toggle-sidebar', handleToggle)
  }, [])

  const selectView = (key: string) => {
    setCurrentView(key)
    setMobileOpen(false)
  }

  return (
    <>
      <aside
        id="sidebar"
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 lg:w-20 xl:w-56 bg-white border-r border-slate-200 flex flex-col justify-between transform transition-transform duration-200 ease-in-out shadow-xl lg:shadow-none ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div>
          <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100">
            <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-semibold">Navegación</span>
            <button className="lg:hidden text-slate-500" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-3 space-y-1.5 mt-1">
            {NAV_ITEMS.filter((item) => !item.permission || hasPermission(item.permission)).map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => selectView(item.key)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition ${isActive ? 'bg-noir-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                  title={item.label}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-champagne-400' : ''}`} />
                  <span className="lg:hidden xl:inline">{item.label}</span>
                  {item.key === 'inventario' && lowStockCount > 0 && (
                    <span className="ml-auto hidden xl:inline-flex px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">
                      {lowStockCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 hidden xl:block">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 mb-1">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sesión JWT Activa</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {usuario?.nombre ?? 'Usuario'} · {usuario?.rol === 'ROLE_ADMIN' ? 'Acceso total' : 'Caja'}
            </p>
          </div>
        </div>
      </aside>

      <div
        id="sidebar-overlay"
        className={`fixed inset-0 bg-slate-900/50 z-20 transition-opacity duration-200 ${mobileOpen ? 'block opacity-100' : 'hidden opacity-0'} lg:hidden`}
        onClick={() => setMobileOpen(false)}
      />

      <button
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-noir-950 text-champagne-300 p-3 rounded-full shadow-xl hover:bg-noir-800 transition"
        onClick={() => setMobileOpen((open) => !open)}
        aria-label="Abrir menú"
      >
        <Menu className="w-6 h-6" />
      </button>
    </>
  )
}
