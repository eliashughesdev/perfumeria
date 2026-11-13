import { PlusCircle, MinusCircle, Wallet, TrendingUp, TrendingDown, Award, BarChart3 } from 'lucide-react'

interface CajaViewProps {
  showToast: (msg: string) => void
}

export function CajaView({ showToast }: CajaViewProps) {
  const [initialFund, setInitialFund] = useState(150)
  const [isOpened, setIsOpened] = useState(false)
  const [movements, setMovements] = useState<Array<{ hora: string; concepto: string; metodo: string; usuario: string; monto: string; type: 'base' | 'efectivo' | 'tarjeta' | 'otro' }>>([
    { hora: '08:30 AM', concepto: 'Apertura de Caja', metodo: 'Base', usuario: 'Ana Gómez', monto: '$150.00', type: 'base' },
  ])

  const [cashSalesEfectivo, setCashSalesEfectivo] = useState(345)
  const [cashSalesTarjeta, setCashSalesTarjeta] = useState(520)

  const expected = initialFund + cashSalesEfectivo

  const registerMovement = (type: 'ingreso' | 'egreso') => {
    showToast(type === 'ingreso' ? 'Entrada de efectivo registrada en gaveta.' : 'Salida de caja menor registrada.')
  }

  return (
    <section id="view-caja" className="view-section hidden flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Control de Caja y Turnos</h2>
          <p className="text-xs text-slate-500">Gestión de apertura, movimientos en efectivo y arqueo diario</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => registerMovement('ingreso')}
            disabled={!isOpened}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusCircle className="w-4 h-4" /> Entrada Efectivo
          </button>
          <button
            onClick={() => registerMovement('egreso')}
            disabled={!isOpened}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MinusCircle className="w-4 h-4" /> Salida / Gasto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Fondo Inicial (Apertura)</span>
          <p className="text-2xl font-bold text-slate-800 mt-1">${initialFund.toFixed(2)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Turno {isOpened ? 'iniciado' : 'pendiente'}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Ventas en Efectivo</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">${cashSalesEfectivo.toFixed(2)}</p>
          <span className="text-[11px] text-emerald-600 mt-1 block">+5 tickets cobrados</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Ventas Tarjeta / Transf.</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">${cashSalesTarjeta.toFixed(2)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">No ingresa a gaveta física</span>
        </div>
        <div className="bg-plum-900 text-white p-4 rounded-2xl shadow-md">
          <span className="text-xs font-medium text-plum-200">Efectivo Esperado en Gaveta</span>
          <p className="text-2xl font-bold text-gold-400 mt-1">${expected.toFixed(2)}</p>
          <span className="text-[11px] text-plum-200 mt-1 block">Base + Efectivo + Movimientos</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">Movimientos del Turno Actual</h3>
          <button
            onClick={() => showToast('Arqueo de caja generado e impreso en ticket térmico.')}
            className="text-xs font-semibold text-plum-800 hover:underline"
          >
            Cerrar Turno y Realizar Arqueo →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Hora</th>
                <th className="px-5 py-3">Concepto</th>
                <th className="px-5 py-3">Método</th>
                <th className="px-5 py-3">Usuario</th>
                <th className="px-5 py-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody id="cash-movements-list" className="divide-y divide-slate-100">
              {movements.map((m, i) => (
                <tr key={i} className={m.type === 'efectivo' ? 'bg-emerald-50/40' : ''}>
                  <td className="px-5 py-3 text-slate-500">{m.hora}</td>
                  <td className="px-5 py-3 font-medium">{m.concepto}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded ${m.type === 'base' ? 'bg-slate-100 text-slate-600' : m.type === 'efectivo' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>{m.metodo}</span>
                  </td>
                  <td className="px-5 py-3">{m.usuario}</td>
                  <td className="px-5 py-3 text-right font-bold text-slate-700">{m.monto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

import { useState } from 'react'
