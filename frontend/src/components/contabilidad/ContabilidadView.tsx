import { TrendingUp, TrendingDown, Award } from 'lucide-react'

interface ContabilidadViewProps {
  isAdmin: boolean
  showToast: (msg: string) => void
}

export function ContabilidadView({ isAdmin, showToast }: ContabilidadViewProps) {
  if (!isAdmin) {
    showToast('Acceso denegado: Se requiere rol de Administrador (RBAC).')
    return null
  }

  return (
    <section id="view-contabilidad" className="view-section flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Contabilidad Básica y Rentabilidad</h2>
        <p className="text-xs text-slate-500">Resumen financiero del mes: Ingresos brutos, costo de mercancía vendida y utilidad neta</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Ingresos Totales (Mes)</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">$14,850.00</p>
          <p className="text-xs text-emerald-600 mt-1 font-medium">+18.4% respecto al mes anterior</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Costo de Mercancía + Gastos</span>
            <span className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">$8,420.00</p>
          <p className="text-xs text-slate-400 mt-1">Reposición proveedores y operativos</p>
        </div>

        <div className="bg-gradient-to-br from-plum-900 to-plum-950 text-white p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gold-300">Utilidad Neta Estimada</span>
            <span className="p-2 rounded-lg bg-white/10 text-gold-400">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-white mt-2">$6,430.00</p>
          <p className="text-xs text-plum-200 mt-1">Margen de ganancia promedio: 43.3%</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-sm text-slate-800 mb-4">Ventas vs. Costos (Últimos 6 meses)</h3>
        <div className="grid grid-cols-6 gap-3 h-48 items-end pt-6 px-2 border-b border-slate-100">
          {[
            { mes: 'Jun', h: '55%', color: 'bg-plum-800' },
            { mes: 'Jul', h: '68%', color: 'bg-plum-800' },
            { mes: 'Ago', h: '62%', color: 'bg-plum-800' },
            { mes: 'Sep', h: '75%', color: 'bg-plum-800' },
            { mes: 'Oct', h: '82%', color: 'bg-plum-800' },
            { mes: 'Nov', h: '95%', color: 'bg-gold-400', bold: true },
          ].map((m) => (
            <div key={m.mes} className="flex flex-col items-center gap-1 h-full justify-end">
              <div className={`w-full max-w-[36px] ${m.color} rounded-t-md h-[${m.h}] ${m.bold ? 'shadow' : ''}`}></div>
              <span className={`text-[11px] ${m.bold ? 'font-bold text-plum-900' : 'text-slate-500'}`}>{m.mes}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
