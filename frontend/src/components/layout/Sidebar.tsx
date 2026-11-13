import { ShoppingBag, Wallet, Package, BarChart3, ShieldCheck, Lock, Menu } from 'lucide-react'
import { useState, useEffect } from 'react'

interface NavItem {
  key: string
  label: string
  icon: React.ElementType
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { key: 'pos', label: 'Punto de Venta', icon: ShoppingBag },
  { key: 'caja', label: 'Control de Caja', icon: Wallet },
  { key: 'inventario', label: 'Inventario', icon: Package },
  { key: 'contabilidad', label: 'Contabilidad', icon: BarChart3, adminOnly: true },
  { key: 'usuarios', label: 'Usuarios & RBAC', icon: ShieldCheck, adminOnly: true },
]

interface SidebarProps {
  currentView: string
  setCurrentView: (key: string) => void
  isAdmin: boolean
  lowStockCount: number
}

export function Sidebar({ currentView, setCurrentView, isAdmin, lowStockCount }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <aside
        id="sidebar"
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 lg:w-20 xl:w-56 bg-white border-r border-slate-200 flex flex-col justify-between transform transition-transform duration-200 ease-in-out shadow-xl lg:shadow-none ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <nav className="p-3 space-y-1.5 mt-14 lg:mt-2">
          {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.key
            return (
              <button
                key={item.key}
                onClick={() => setCurrentView(item.key)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition ${isActive ? 'bg-plum-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-gold-400' : ''}`} />
                {window.innerWidth >= 1024 && <span>{item.label}</span>}
                {item.key === 'inventario' && lowStockCount > 0 && window.innerWidth >= 1024 && (
                  <span className="ml-auto inline-flex px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">
                    {lowStockCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 lg:hidden xl:block">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sesión JWT Activa</span>
            </div>
            <p className="text-[11px] text-slate-500">Conexión cifrada TLS • Sincronización en tiempo real</p>
          </div>
        </div>
      </aside>

      <div
        id="sidebar-overlay"
        className={`fixed inset-0 bg-slate-900/50 z-20 transition-opacity duration-200 ${mobileOpen ? 'block opacity-100' : 'hidden opacity-0'} lg:hidden`}
        onClick={() => setMobileOpen(false)}
      ></div>

      <button
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-plum-900 text-white p-3 rounded-full shadow-xl hover:bg-plum-800 transition"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Abrir menú"
      >
        <Menu className="w-6 h-6" />
      </button>
    </>
  )
}
