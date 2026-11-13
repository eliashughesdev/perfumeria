import { useEffect, useState } from 'react'
import { PlusCircle, MinusCircle } from 'lucide-react'
import { cajaService } from '@/services/api'

interface CajaViewProps {
  showToast: (msg: string) => void
}

export function CajaView({ showToast }: CajaViewProps) {
  const [initialFund, setInitialFund] = useState(0)
  const [isOpened, setIsOpened] = useState(false)
  const [fundInput, setFundInput] = useState('150')
  const [movAmount, setMovAmount] = useState('')
  const [movConcept, setMovConcept] = useState('')
  const [cashSalesEfectivo, setCashSalesEfectivo] = useState(0)
  const [cashSalesTarjeta, setCashSalesTarjeta] = useState(0)
  const [expected, setExpected] = useState(0)
  const [movements, setMovements] = useState<Array<{ hora: string; concepto: string; metodo: string; monto: string; type: string }>>([])

  const load = async () => {
    const [resumen, movs] = await Promise.all([cajaService.resumen(), cajaService.movimientos()])
    const r = resumen.data as any
    setInitialFund(Number(r.FondoInicial ?? r.fondoInicial ?? 0))
    setCashSalesEfectivo(Number(r.VentasEfectivo ?? r.ventasEfectivo ?? 0))
    setCashSalesTarjeta(Number(r.VentasNoEfectivo ?? r.ventasNoEfectivo ?? 0))
    setExpected(Number(r.EfectivoEsperado ?? r.efectivoEsperado ?? 0))
    const rows = (movs.data as any[]).map((m) => {
      const tipo = m.Tipo ?? m.tipo
      const fecha = new Date(m.FechaMovimiento ?? m.fechaMovimiento)
      return {
        hora: fecha.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
        concepto: m.Concepto ?? m.concepto,
        metodo: m.MetodoPago ?? m.metodoPago ?? tipo,
        monto: `$${Number(m.Monto ?? m.monto).toFixed(2)}`,
        type: tipo === 'Venta' ? 'efectivo' : tipo === 'Apertura' ? 'base' : 'otro',
      }
    })
    setMovements(rows)
    setIsOpened(rows.some((m) => m.concepto.toLowerCase().includes('fondo') || m.type === 'base'))
  }

  useEffect(() => {
    load().catch(() => showToast('No se pudo cargar la caja.'))
  }, [])

  const openShift = async () => {
    try {
      await cajaService.apertura(parseFloat(fundInput) || 0)
      showToast('Caja abierta.')
      await load()
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'No se pudo abrir la caja.')
    }
  }

  const registerMovement = async (type: 'Ingreso' | 'Egreso') => {
    const monto = parseFloat(movAmount)
    if (!monto || !movConcept.trim()) {
      showToast('Indica concepto y monto.')
      return
    }
    try {
      await cajaService.movimiento({ Tipo: type, Concepto: movConcept, Monto: monto, MetodoPago: 'Efectivo' } as any)
      setMovAmount('')
      setMovConcept('')
      showToast(type === 'Ingreso' ? 'Entrada registrada.' : 'Salida registrada.')
      await load()
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'No se pudo registrar el movimiento.')
    }
  }

  const closeShift = async () => {
    try {
      await cajaService.cierre()
      showToast('Turno cerrado.')
      await load()
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'No se pudo cerrar el turno.')
    }
  }

  return (
    <section id="view-caja" className="view-section flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Control de Caja y Turnos</h2>
          <p className="text-xs text-slate-500">Gestión de apertura, movimientos en efectivo y arqueo diario</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {!isOpened && (
            <>
              <input value={fundInput} onChange={(e) => setFundInput(e.target.value)} className="w-24 px-2 py-2 rounded-xl border border-slate-200 text-xs" />
              <button onClick={openShift} className="px-3.5 py-2 rounded-xl bg-plum-900 text-white text-xs font-semibold">Abrir caja</button>
            </>
          )}
          <input value={movConcept} onChange={(e) => setMovConcept(e.target.value)} placeholder="Concepto" className="w-36 px-2 py-2 rounded-xl border border-slate-200 text-xs" />
          <input value={movAmount} onChange={(e) => setMovAmount(e.target.value)} placeholder="Monto" className="w-20 px-2 py-2 rounded-xl border border-slate-200 text-xs" />
          <button onClick={() => registerMovement('Ingreso')} disabled={!isOpened} className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50">
            <PlusCircle className="w-4 h-4" /> Entrada
          </button>
          <button onClick={() => registerMovement('Egreso')} disabled={!isOpened} className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50">
            <MinusCircle className="w-4 h-4" /> Salida
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
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Ventas Tarjeta / Transf.</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">${cashSalesTarjeta.toFixed(2)}</p>
        </div>
        <div className="bg-plum-900 text-white p-4 rounded-2xl shadow-md">
          <span className="text-xs font-medium text-plum-200">Efectivo Esperado en Gaveta</span>
          <p className="text-2xl font-bold text-gold-400 mt-1">${expected.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">Movimientos del Turno Actual</h3>
          <button onClick={closeShift} className="text-xs font-semibold text-plum-800 hover:underline">Cerrar Turno y Realizar Arqueo →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Hora</th>
                <th className="px-5 py-3">Concepto</th>
                <th className="px-5 py-3">Método</th>
                <th className="px-5 py-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-6 text-center text-slate-400">Sin movimientos hoy. Abre la caja para empezar.</td></tr>
              ) : movements.map((m, i) => (
                <tr key={i}>
                  <td className="px-5 py-3 text-slate-500">{m.hora}</td>
                  <td className="px-5 py-3 font-medium">{m.concepto}</td>
                  <td className="px-5 py-3">{m.metodo}</td>
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
