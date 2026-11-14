import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Award,
  Download,
  Loader2,
  CalendarRange,
  ShoppingBag,
  Wallet,
  Pencil,
  BarChart3,
} from 'lucide-react'
import { accountingService, saleService } from '@/services/api'
import { mapReporte, mapVenta } from '@/services/mappers'
import { useAuth } from '@/contexts/AuthContext'
import { InvoiceEditModal } from './InvoiceEditModal'
import type { ContabilidadReporte, Producto, Venta } from '@/types'

interface ContabilidadViewProps {
  products: Producto[]
  taxRate: number
  showToast: (msg: string) => void
}

const today = () => new Date().toISOString().slice(0, 10)
const monthStart = () => {
  const date = new Date()
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10)
}

const money = (value: number) => `$${Number(value ?? 0).toFixed(2)}`

export function ContabilidadView({ products, taxRate, showToast }: ContabilidadViewProps) {
  const { hasPermission } = useAuth()
  const canEditInvoices = hasPermission('factura.editar')

  const [desde, setDesde] = useState(monthStart)
  const [hasta, setHasta] = useState(today)
  const [report, setReport] = useState<ContabilidadReporte | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [editingSale, setEditingSale] = useState<Venta | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await accountingService.report({ desde, hasta })
      setReport(mapReporte(response.data as any))
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'No se pudo cargar el reporte contable.')
    } finally {
      setLoading(false)
    }
  }, [desde, hasta, showToast])

  useEffect(() => {
    load()
  }, [load])

  const openInvoice = async (saleId: number) => {
    try {
      const response = await saleService.get(saleId)
      setEditingSale(mapVenta(response.data as any))
    } catch {
      showToast('No se pudo abrir la factura.')
    }
  }

  const downloadCsv = async () => {
    setDownloading(true)
    try {
      const response = await accountingService.downloadCsv({ desde, hasta })
      const url = URL.createObjectURL(response.data as Blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `contabilidad_${desde}_${hasta}.csv`
      link.click()
      URL.revokeObjectURL(url)
      showToast('Reporte CSV descargado.')
    } catch {
      showToast('No se pudo descargar el reporte.')
    } finally {
      setDownloading(false)
    }
  }

  const chart = useMemo(() => {
    const points = report?.serieDiaria.slice(-14) ?? []
    const max = Math.max(1, ...points.map((point) => Math.max(point.ventas, point.costo)))
    return { points, max }
  }, [report])

  if (loading && !report) {
    return (
      <section className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Calculando contabilidad...
      </section>
    )
  }

  if (!report) return null

  const totales = report.totales
  const maxPayment = Math.max(1, ...report.metodosPago.map((method) => method.monto))

  return (
    <section id="view-contabilidad" className="view-section flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Contabilidad y Rentabilidad</h2>
          <p className="text-xs text-slate-500">Ventas, costo de mercancía, gastos de caja y utilidad real del período</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1.5">
            <CalendarRange className="w-4 h-4 text-slate-400" />
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="text-[11px] px-1 py-0.5 bg-transparent focus:outline-none" />
            <span className="text-slate-300">→</span>
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="text-[11px] px-1 py-0.5 bg-transparent focus:outline-none" />
          </div>
          <button onClick={load} disabled={loading} className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 flex items-center gap-1.5">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5" />} Actualizar
          </button>
          <button onClick={downloadCsv} disabled={downloading} className="px-3 py-2 rounded-xl bg-noir-950 text-white text-[11px] font-semibold hover:bg-noir-800 disabled:opacity-60 flex items-center gap-1.5">
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Ventas Brutas</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><TrendingUp className="w-4 h-4" /></span>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">{money(totales.ventasBrutas)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{totales.tickets} tickets · {totales.unidadesVendidas} unidades</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Costo + Gastos</span>
            <span className="p-2 rounded-lg bg-rose-50 text-rose-600"><TrendingDown className="w-4 h-4" /></span>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">{money(totales.costoMercancia + totales.gastosCaja)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Mercancía {money(totales.costoMercancia)} · Caja {money(totales.gastosCaja)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Ticket Promedio</span>
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><ShoppingBag className="w-4 h-4" /></span>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">{money(totales.ticketPromedio)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Descuentos: {money(totales.descuentos)} · ITBIS: {money(totales.itbis)}</p>
        </div>

        <div className="bg-gradient-to-br from-noir-950 to-noir-900 text-white p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-champagne-300">Utilidad Neta</span>
            <span className="p-2 rounded-lg bg-white/10 text-champagne-400"><Award className="w-4 h-4" /></span>
          </div>
          <p className={`text-2xl font-bold mt-2 ${totales.utilidadNeta < 0 ? 'text-rose-300' : 'text-white'}`}>{money(totales.utilidadNeta)}</p>
          <p className="text-[11px] text-noir-300 mt-1">Margen {totales.margenPorcentaje.toFixed(1)}% · Bruta {money(totales.utilidadBruta)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-800">Ventas vs. Costo (últimos días)</h3>
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-noir-800" /> Ventas</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-champagne-400" /> Costo</span>
            </div>
          </div>
          {chart.points.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-slate-400 text-xs">Sin ventas en el período seleccionado.</div>
          ) : (
            <div className="h-52 flex items-end gap-2 border-b border-slate-100 pb-1 overflow-x-auto">
              {chart.points.map((point) => (
                <div key={point.fecha} className="flex-1 min-w-[24px] h-full flex flex-col justify-end items-center gap-1 group relative">
                  <div className="w-full flex items-end justify-center gap-0.5 h-full">
                    <div
                      className="w-2/5 bg-noir-800 rounded-t-sm group-hover:bg-noir-700 transition"
                      style={{ height: `${Math.max(3, (point.ventas / chart.max) * 100)}%` }}
                      title={`Ventas ${money(point.ventas)}`}
                    />
                    <div
                      className="w-2/5 bg-champagne-400 rounded-t-sm group-hover:bg-champagne-500 transition"
                      style={{ height: `${Math.max(2, (point.costo / chart.max) * 100)}%` }}
                      title={`Costo ${money(point.costo)}`}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 whitespace-nowrap">{point.fecha.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2"><Wallet className="w-4 h-4 text-champagne-600" /> Métodos de pago</h3>
          {report.metodosPago.length === 0 ? (
            <p className="text-xs text-slate-400">Sin cobros registrados.</p>
          ) : (
            <div className="space-y-3">
              {report.metodosPago.map((method) => (
                <div key={method.metodo}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-medium text-slate-600">{method.metodo}</span>
                    <span className="font-bold text-slate-700">{money(method.monto)} <span className="text-slate-400 font-normal">({method.tickets})</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-champagne-400 to-champagne-600" style={{ width: `${(method.monto / maxPayment) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <p className="text-slate-400">Inventario a costo</p>
              <p className="font-bold text-slate-700">{money(report.inventario.valorCosto)}</p>
            </div>
            <div>
              <p className="text-slate-400">Inventario a venta</p>
              <p className="font-bold text-slate-700">{money(report.inventario.valorVenta)}</p>
            </div>
            <div>
              <p className="text-slate-400">Unidades</p>
              <p className="font-bold text-slate-700">{report.inventario.unidades}</p>
            </div>
            <div>
              <p className="text-slate-400">Stock bajo</p>
              <p className={`font-bold ${report.inventario.stockBajo > 0 ? 'text-amber-600' : 'text-slate-700'}`}>{report.inventario.stockBajo}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800">Top productos por venta</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Producto</th>
                  <th className="px-4 py-2.5 text-right">Unid.</th>
                  <th className="px-4 py-2.5 text-right">Ventas</th>
                  <th className="px-4 py-2.5 text-right">Utilidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.topProductos.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Sin productos vendidos.</td></tr>
                ) : report.topProductos.map((product) => (
                  <tr key={`${product.sku}-${product.nombre}`}>
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-slate-700 line-clamp-1">{product.nombre}</p>
                      <p className="text-[9px] text-slate-400 font-mono">{product.sku}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{product.unidades}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{money(product.ventas)}</td>
                    <td className={`px-4 py-2.5 text-right font-bold ${product.utilidad < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{money(product.utilidad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800">Ventas recientes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] tracking-wider">
                <tr>
                  <th className="px-4 py-2.5">Factura</th>
                  <th className="px-4 py-2.5">Cliente</th>
                  <th className="px-4 py-2.5">Fecha</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                  {canEditInvoices && <th className="px-4 py-2.5 text-right">Editar</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.ventasRecientes.length === 0 ? (
                  <tr><td colSpan={canEditInvoices ? 5 : 4} className="px-4 py-6 text-center text-slate-400">Sin ventas en el período.</td></tr>
                ) : report.ventasRecientes.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-4 py-2.5 font-mono text-slate-600">{sale.numeroFactura}</td>
                    <td className="px-4 py-2.5 text-slate-600 max-w-[120px] truncate">{sale.cliente}</td>
                    <td className="px-4 py-2.5 text-slate-500">{new Date(sale.fechaVenta).toLocaleDateString('es-DO')}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-700">{money(sale.total)}</td>
                    {canEditInvoices && (
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={() => openInvoice(sale.id)} className="p-1.5 rounded-lg text-champagne-700 hover:bg-champagne-50" title="Editar items de la factura">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editingSale && (
        <InvoiceEditModal
          sale={editingSale}
          products={products}
          taxRate={taxRate}
          showToast={showToast}
          onClose={() => setEditingSale(null)}
          onSaved={() => {
            load()
          }}
        />
      )}
    </section>
  )
}
