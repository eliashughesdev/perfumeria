import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Pencil,
  Printer,
  ReceiptText,
  RefreshCw,
  Search,
  Wallet,
} from 'lucide-react'
import { saleService } from '@/services/api'
import { mapVenta } from '@/services/mappers'
import { InvoiceEditModal } from '@/components/contabilidad/InvoiceEditModal'
import type { Producto, Venta } from '@/types'

interface FacturasViewProps {
  products: Producto[]
  taxRate: number
  showToast: (msg: string) => void
  onPreview: (saleId: number) => Promise<void>
}

const today = () => new Date().toISOString().slice(0, 10)
const monthStart = () => {
  const date = new Date()
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10)
}

const money = (value: number) => `$${Number(value ?? 0).toFixed(2)}`

const formatDate = (value: string) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-DO', { dateStyle: 'short', timeStyle: 'short' })
}

export function FacturasView({ products, taxRate, showToast, onPreview }: FacturasViewProps) {
  const [desde, setDesde] = useState(monthStart)
  const [hasta, setHasta] = useState(today)
  const [search, setSearch] = useState('')
  const [method, setMethod] = useState('Todos')
  const [cashStatus, setCashStatus] = useState('Todas')
  const [sales, setSales] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [editingSale, setEditingSale] = useState<Venta | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await saleService.list({
        limite: 500,
        desde: desde || undefined,
        hasta: hasta || undefined,
      })
      setSales((response.data as any[]).map(mapVenta))
    } catch (loadError: any) {
      const message = loadError?.response?.data?.detail || 'No se pudieron cargar las facturas.'
      setError(message)
      showToast(message)
    } finally {
      setLoading(false)
    }
  }, [desde, hasta, showToast])

  useEffect(() => {
    load()
  }, [load])

  const filteredSales = useMemo(() => {
    const term = search.trim().toLowerCase()
    return sales.filter((sale) => {
      const matchesSearch =
        !term ||
        sale.numeroFactura.toLowerCase().includes(term) ||
        (sale.ncf ?? '').toLowerCase().includes(term) ||
        sale.cliente.toLowerCase().includes(term) ||
        (sale.cajero ?? '').toLowerCase().includes(term)
      const matchesMethod = method === 'Todos' || sale.metodoPago === method
      const matchesStatus =
        cashStatus === 'Todas' ||
        (cashStatus === 'Cerradas' ? sale.cajaCerrada === true : sale.cajaCerrada !== true)
      return matchesSearch && matchesMethod && matchesStatus
    })
  }, [sales, search, method, cashStatus])

  const totals = useMemo(
    () => ({
      monto: filteredSales.reduce((sum, sale) => sum + sale.total, 0),
      cerradas: filteredSales.filter((sale) => sale.cajaCerrada).length,
      abiertas: filteredSales.filter((sale) => !sale.cajaCerrada).length,
    }),
    [filteredSales],
  )

  const handleSaved = (updated: Venta) => {
    setSales((current) =>
      current.map((sale) =>
        sale.id === updated.id
          ? {
              ...updated,
              cajero: updated.cajero ?? sale.cajero,
              cajaCerrada: updated.cajaCerrada ?? sale.cajaCerrada,
            }
          : sale,
      ),
    )
  }

  return (
    <section id="view-facturas" className="view-section flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Facturas emitidas</h2>
          <p className="text-xs text-slate-500">
            Consulta, imprime y corrige facturas de turnos abiertos o cerrados.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 flex items-center gap-1.5 w-fit"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500">Facturas listadas</span>
          <p className="text-2xl font-bold text-slate-800 mt-1">{filteredSales.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">{sales.length} en el período seleccionado</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500">Total facturado</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{money(totals.monto)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Según los filtros aplicados</p>
        </div>
        <div className="bg-noir-950 text-white p-4 rounded-2xl shadow-md">
          <span className="text-[11px] font-semibold text-champagne-300">Estado de turnos</span>
          <p className="text-2xl font-bold text-champagne-400 mt-1">{totals.cerradas} cerradas</p>
          <p className="text-[11px] text-noir-300 mt-1">{totals.abiertas} en turno abierto</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col xl:flex-row gap-2 xl:items-center">
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2">
          <input type="date" value={desde} onChange={(event) => setDesde(event.target.value)} className="text-[11px] bg-transparent focus:outline-none" />
          <span className="text-slate-300">→</span>
          <input type="date" value={hasta} onChange={(event) => setHasta(event.target.value)} className="text-[11px] bg-transparent focus:outline-none" />
        </div>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar factura, NCF, cliente o cajero..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs"
          />
        </div>
        <select value={method} onChange={(event) => setMethod(event.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white">
          <option value="Todos">Todos los pagos</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Tarjeta">Tarjeta</option>
          <option value="Transferencia">Transferencia</option>
        </select>
        <select value={cashStatus} onChange={(event) => setCashStatus(event.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white">
          <option value="Todas">Todos los turnos</option>
          <option value="Abiertas">Turno abierto</option>
          <option value="Cerradas">Turno cerrado</option>
        </select>
      </div>

      {error ? (
        <div className="bg-white border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <ReceiptText className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No se pudieron cargar las facturas</p>
          <p className="text-xs text-slate-500">{error}</p>
          <button onClick={load} className="px-4 py-2 rounded-xl bg-noir-950 text-white text-xs font-semibold">
            Reintentar
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 w-8" />
                  <th className="px-4 py-3">Factura / NCF</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Cajero</th>
                  <th className="px-4 py-3">Pago</th>
                  <th className="px-4 py-3 text-center">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Turno</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && sales.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Cargando facturas...
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                      No hay facturas que coincidan con los filtros.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => {
                    const isExpanded = expanded === sale.id
                    return (
                      <Fragment key={sale.id}>
                        <tr
                          onClick={() => setExpanded(isExpanded ? null : sale.id)}
                          className={`cursor-pointer transition hover:bg-slate-50/80 ${isExpanded ? 'bg-champagne-50/50' : ''}`}
                        >
                          <td className="px-4 py-3 text-slate-400">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-mono font-semibold text-slate-700">{sale.numeroFactura}</p>
                            <p className="text-[9px] text-slate-400 font-mono">{sale.ncf || 'Sin NCF'}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(sale.fechaVenta)}</td>
                          <td className="px-4 py-3 text-slate-600 max-w-[150px] truncate">{sale.cliente}</td>
                          <td className="px-4 py-3 text-slate-500">{sale.cajero || '—'}</td>
                          <td className="px-4 py-3 text-slate-500">{sale.metodoPago}</td>
                          <td className="px-4 py-3 text-center text-slate-500">{sale.detalles?.length ?? 0}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-700">{money(sale.total)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                sale.cajaCerrada
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              <Wallet className="w-3 h-3" />
                              {sale.cajaCerrada ? 'Cerrada' : 'Abierta'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setEditingSale(sale)
                                }}
                                className="p-1.5 rounded-lg text-champagne-700 hover:bg-champagne-50"
                                title="Editar items de la factura"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(event) => {
                                  event.stopPropagation()
                                  void onPreview(sale.id)
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                                title="Ver e imprimir factura"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={10} className="bg-slate-50/80 px-4 py-4">
                              <div className="grid xl:grid-cols-[1fr_auto] gap-4">
                                <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl">
                                  <table className="w-full text-left text-[11px]">
                                    <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] tracking-wider">
                                      <tr>
                                        <th className="px-3 py-2">Cant.</th>
                                        <th className="px-3 py-2">Producto</th>
                                        <th className="px-3 py-2">SKU</th>
                                        <th className="px-3 py-2 text-right">Precio</th>
                                        <th className="px-3 py-2 text-right">Importe</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {(sale.detalles ?? []).map((detail) => (
                                        <tr key={detail.id ?? `${sale.id}-${detail.idProducto}`}>
                                          <td className="px-3 py-2 font-bold text-slate-600">{detail.cantidad}</td>
                                          <td className="px-3 py-2 text-slate-600">{detail.nombreProducto || '—'}</td>
                                          <td className="px-3 py-2 font-mono text-[10px] text-slate-400">{detail.sku || '—'}</td>
                                          <td className="px-3 py-2 text-right text-slate-500">{money(detail.precioUnitario)}</td>
                                          <td className="px-3 py-2 text-right font-semibold text-slate-700">{money(detail.importe)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-xl p-3 min-w-[190px] text-[11px] text-slate-500 space-y-1">
                                  <p className="flex justify-between"><span>Subtotal</span><span>{money(sale.subtotal)}</span></p>
                                  <p className="flex justify-between"><span>Descuento</span><span className="text-rose-600">-{money(sale.descuentoMonto)}</span></p>
                                  <p className="flex justify-between"><span>ITBIS</span><span>{money(sale.itbis)}</span></p>
                                  <p className="flex justify-between font-bold text-slate-800 border-t border-slate-100 pt-1"><span>Total</span><span>{money(sale.total)}</span></p>
                                  <button
                                    onClick={() => setEditingSale(sale)}
                                    className="mt-2 w-full py-2 rounded-lg bg-noir-950 text-white text-[10px] font-semibold flex items-center justify-center gap-1.5"
                                  >
                                    <Pencil className="w-3 h-3" /> Corregir factura
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingSale && (
        <InvoiceEditModal
          sale={editingSale}
          products={products}
          taxRate={taxRate}
          showToast={showToast}
          onClose={() => setEditingSale(null)}
          onSaved={handleSaved}
        />
      )}
    </section>
  )
}
