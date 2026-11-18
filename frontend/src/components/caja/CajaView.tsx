import { useCallback, useEffect, useState } from 'react'
import { PlusCircle, MinusCircle, LockKeyhole, UnlockKeyhole, Calculator, ShieldAlert, Loader2 } from 'lucide-react'
import { cajaService } from '@/services/api'
import { mapMovimientoCaja, mapResumenCaja } from '@/services/mappers'
import { useAuth } from '@/contexts/AuthContext'
import type { MovimientoCaja, ResumenCaja } from '@/types'

interface CajaViewProps {
  showToast: (msg: string) => void
}

export function CajaView({ showToast }: CajaViewProps) {
  const { hasPermission, hasRole } = useAuth()
  const isAdmin = hasRole('ROLE_ADMIN')
  const canMove = hasPermission('caja.movimientos')

  const [summary, setSummary] = useState<ResumenCaja | null>(null)
  const [movements, setMovements] = useState<MovimientoCaja[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [fundInput, setFundInput] = useState('150')
  const [movAmount, setMovAmount] = useState('')
  const [movConcept, setMovConcept] = useState('')
  const [counted, setCounted] = useState('')
  const [showClose, setShowClose] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [resumenResponse, movimientosResponse] = await Promise.all([cajaService.resumen(), cajaService.movimientos()])
      const nextSummary = mapResumenCaja(resumenResponse.data as any)
      setSummary(nextSummary)
      setMovements((movimientosResponse.data as any[]).map(mapMovimientoCaja))
      if (nextSummary.efectivoEsperado > 0) setCounted(nextSummary.efectivoEsperado.toFixed(2))
    } catch (loadError: any) {
      setError(loadError?.response?.data?.detail || 'No se pudo cargar la información de caja.')
      throw loadError
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load().catch(() => showToast('No se pudo cargar la caja.'))
  }, [load, showToast])

  const openShift = async () => {
    setBusy(true)
    try {
      await cajaService.apertura(parseFloat(fundInput) || 0)
      showToast('Caja abierta correctamente.')
      await load()
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'No se pudo abrir la caja.')
    } finally {
      setBusy(false)
    }
  }

  const registerMovement = async (type: 'Ingreso' | 'Egreso') => {
    const monto = parseFloat(movAmount)
    if (!monto || !movConcept.trim()) {
      showToast('Indica concepto y monto.')
      return
    }
    setBusy(true)
    try {
      await cajaService.movimiento({ Tipo: type, Concepto: movConcept.trim(), Monto: monto, MetodoPago: 'Efectivo' } as any)
      setMovAmount('')
      setMovConcept('')
      showToast(type === 'Ingreso' ? 'Entrada registrada.' : 'Salida registrada.')
      await load()
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'No se pudo registrar el movimiento.')
    } finally {
      setBusy(false)
    }
  }

  const closeShift = async () => {
    setBusy(true)
    try {
      await cajaService.cierre(counted === '' ? undefined : parseFloat(counted))
      showToast('Turno cerrado y arqueo registrado.')
      setShowClose(false)
      await load()
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'No se pudo cerrar el turno.')
    } finally {
      setBusy(false)
    }
  }

  if (loading && !summary) {
    return (
      <section className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando caja...
      </section>
    )
  }

  if (!summary) {
    return (
      <section className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white border border-rose-200 rounded-2xl p-6 text-center space-y-3 shadow-sm">
          <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No se pudo abrir el control de caja</p>
          <p className="text-xs text-slate-500">{error || 'Revisa la conexión con el servidor.'}</p>
          <button onClick={() => load().catch(() => showToast('No se pudo cargar la caja.'))} className="px-4 py-2 rounded-xl bg-noir-950 text-white text-xs font-semibold">
            Reintentar
          </button>
        </div>
      </section>
    )
  }

  const expected = summary.efectivoEsperado
  const difference = parseFloat(counted || '0') - expected

  return (
    <section id="view-caja" className="view-section flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Control de Caja y Turnos</h2>
          <p className="text-xs text-slate-500">
            Estado: <span className={`font-semibold ${summary.abierta ? 'text-emerald-600' : 'text-rose-600'}`}>{summary.estado}</span>
            {summary.fechaApertura && ` · Apertura ${new Date(summary.fechaApertura).toLocaleString('es-DO')}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {!summary.abierta && isAdmin && (
            <>
              <input
                value={fundInput}
                onChange={(e) => setFundInput(e.target.value)}
                type="number"
                min="0"
                className="w-24 px-2 py-2 rounded-xl border border-slate-200 text-xs"
                placeholder="Fondo"
              />
              <button
                onClick={openShift}
                disabled={busy}
                className="px-3.5 py-2 rounded-xl bg-noir-950 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60"
              >
                <UnlockKeyhole className="w-4 h-4 text-champagne-400" /> Abrir caja
              </button>
            </>
          )}
          {summary.abierta && isAdmin && (
            <button
              onClick={() => setShowClose((value) => !value)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <LockKeyhole className="w-4 h-4" /> Cerrar caja / arqueo
            </button>
          )}
          {!isAdmin && (
            <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Solo la administradora abre y cierra el turno.
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Fondo Inicial</span>
          <p className="text-2xl font-bold text-slate-800 mt-1">${summary.fondoInicial.toFixed(2)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">{summary.fechaApertura ? new Date(summary.fechaApertura).toLocaleDateString('es-DO') : 'Sin apertura'}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Ventas en Efectivo</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">${summary.ventasEfectivo.toFixed(2)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Ingresos extra: ${summary.ingresosExtra.toFixed(2)}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Tarjeta / Transferencia</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">${summary.ventasNoEfectivo.toFixed(2)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Egresos: ${summary.egresosExtra.toFixed(2)}</span>
        </div>
        <div className="bg-noir-950 text-white p-4 rounded-2xl shadow-md">
          <span className="text-xs font-medium text-noir-300">Efectivo Esperado en Gaveta</span>
          <p className="text-2xl font-bold text-champagne-400 mt-1">${expected.toFixed(2)}</p>
          {summary.estado === 'Cerrada' && summary.diferencia != null && (
            <span className={`text-[11px] mt-1 block ${summary.diferencia < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
              Arqueo anterior: {summary.diferencia >= 0 ? '+' : ''}${summary.diferencia.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {showClose && summary.abierta && isAdmin && (
        <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-rose-600" />
            <h3 className="font-bold text-sm text-slate-800">Arqueo de cierre</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 items-end text-xs">
            <div>
              <span className="text-slate-500 block mb-1">Efectivo esperado</span>
              <p className="text-lg font-bold text-slate-800">${expected.toFixed(2)}</p>
            </div>
            <div>
              <label className="text-slate-500 block mb-1">Efectivo contado</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={counted}
                onChange={(e) => setCounted(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold"
              />
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Diferencia</span>
              <p className={`text-lg font-bold ${difference < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {difference >= 0 ? '+' : ''}${difference.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowClose(false)} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600">
              Cancelar
            </button>
            <button
              onClick={closeShift}
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Confirmar cierre
            </button>
          </div>
        </div>
      )}

      {summary.abierta && canMove && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col lg:flex-row gap-2 lg:items-center">
          <input
            value={movConcept}
            onChange={(e) => setMovConcept(e.target.value)}
            placeholder="Concepto del movimiento"
            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-xs"
          />
          <input
            value={movAmount}
            onChange={(e) => setMovAmount(e.target.value)}
            placeholder="Monto"
            type="number"
            min="0"
            step="0.01"
            className="w-full lg:w-32 px-3 py-2.5 rounded-xl border border-slate-200 text-xs"
          />
          <button
            onClick={() => registerMovement('Ingreso')}
            disabled={busy}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" /> Entrada
          </button>
          <button
            onClick={() => registerMovement('Egreso')}
            disabled={busy}
            className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <MinusCircle className="w-4 h-4" /> Salida
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">Movimientos del Turno</h3>
          <span className="text-[11px] text-slate-500">{movements.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100 text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3">Hora</th>
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3">Concepto</th>
                <th className="px-5 py-3">Método</th>
                <th className="px-5 py-3 text-right">Monto</th>
                <th className="px-5 py-3 text-right">Contado / Diferencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    Sin movimientos en este turno. {!summary.abierta && 'Solicita a la administradora abrir la caja.'}
                  </td>
                </tr>
              ) : (
                movements.map((movement) => {
                  const isOut = movement.tipo === 'Egreso'
                  return (
                    <tr key={movement.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 text-slate-500">
                        {new Date(movement.fechaMovimiento).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            movement.tipo === 'Venta'
                              ? 'bg-champagne-100 text-champagne-800'
                              : movement.tipo === 'Apertura'
                                ? 'bg-slate-100 text-slate-700'
                                : movement.tipo === 'Cierre'
                                  ? 'bg-rose-100 text-rose-700'
                                  : isOut
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {movement.tipo}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-700">{movement.concepto}</td>
                      <td className="px-5 py-3 text-slate-500">{movement.metodoPago ?? '—'}</td>
                      <td className={`px-5 py-3 text-right font-bold ${isOut ? 'text-rose-600' : 'text-slate-700'}`}>
                        {isOut ? '-' : ''}${movement.monto.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-500">
                        {movement.montoContado != null ? `$${movement.montoContado.toFixed(2)}` : '—'}
                        {movement.diferencia != null && (
                          <span className={`ml-1 font-semibold ${movement.diferencia < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            ({movement.diferencia >= 0 ? '+' : ''}${movement.diferencia.toFixed(2)})
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
