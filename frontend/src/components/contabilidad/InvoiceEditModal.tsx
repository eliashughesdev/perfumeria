import { useMemo, useState } from 'react'
import { X, Plus, Trash2, Loader2, Save, ReceiptText } from 'lucide-react'
import { saleService } from '@/services/api'
import { mapVenta } from '@/services/mappers'
import type { DetalleVenta, Producto, Venta } from '@/types'

interface InvoiceEditModalProps {
  sale: Venta
  products: Producto[]
  taxRate: number
  onClose: () => void
  onSaved: (sale: Venta) => void
  showToast: (msg: string) => void
}

interface EditableItem {
  lineId: string
  idProducto: number
  sku: string
  nombreProducto: string
  cantidad: number
  precioUnitario: number
  esDecant: boolean
}

export function InvoiceEditModal({ sale, products, taxRate, onClose, onSaved, showToast }: InvoiceEditModalProps) {
  const [items, setItems] = useState<EditableItem[]>(
    (sale.detalles ?? []).map((detail: DetalleVenta) => ({
      lineId: `${detail.idProducto}-${detail.esDecant ? 'dec' : 'reg'}`,
      idProducto: detail.idProducto,
      sku: detail.sku ?? '',
      nombreProducto: detail.nombreProducto ?? '',
      cantidad: detail.cantidad,
      precioUnitario: detail.precioUnitario,
      esDecant: Boolean(detail.esDecant),
    })),
  )
  const [discount, setDiscount] = useState(sale.descuentoPorcentaje)
  const [client, setClient] = useState(sale.cliente)
  const [method, setMethod] = useState(sale.metodoPago)
  const [cashReceived, setCashReceived] = useState(sale.efectivoRecibido ?? sale.total)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [saving, setSaving] = useState(false)

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0), [items])
  const discountAmount = subtotal * (discount / 100)
  const base = subtotal - discountAmount
  const tax = base * (taxRate / 100)
  const total = base + tax

  const addProduct = () => {
    const product = products.find((item) => item.id === Number(selectedProduct))
    if (!product) return
    setItems((current) => {
      const existing = current.find((item) => item.idProducto === product.id && !item.esDecant)
      if (existing) {
        return current.map((item) =>
          item.idProducto === product.id && !item.esDecant ? { ...item, cantidad: item.cantidad + 1 } : item,
        )
      }
      return [
        ...current,
        {
          lineId: `${product.id}-reg`,
          idProducto: product.id,
          sku: product.sku,
          nombreProducto: product.nombre,
          cantidad: 1,
          precioUnitario: product.precioVenta,
          esDecant: false,
        },
      ]
    })
    setSelectedProduct('')
  }

  const updateItem = (lineId: string, changes: Partial<EditableItem>) => {
    setItems((current) => current.map((item) => (item.lineId === lineId ? { ...item, ...changes } : item)))
  }

  const removeItem = (lineId: string) => {
    setItems((current) => current.filter((item) => item.lineId !== lineId))
  }

  const save = async () => {
    if (items.length === 0) {
      showToast('La factura debe conservar al menos un producto.')
      return
    }
    if (items.some((item) => item.cantidad <= 0 || item.precioUnitario < 0)) {
      showToast('Revisa cantidades y precios de los items.')
      return
    }
    setSaving(true)
    try {
      const response = await saleService.update(sale.id, {
        Cliente: client.trim() || 'CONSUMIDOR FINAL',
        MetodoPago: method,
        DescuentoPorcentaje: discount,
        EfectivoRecibido: method === 'Efectivo' ? cashReceived : undefined,
        Detalles: items.map((item) => ({
          IdProducto: item.idProducto,
          SKU: item.sku,
          NombreProducto: item.nombreProducto,
          Cantidad: item.cantidad,
          PrecioUnitario: item.precioUnitario,
          EsDecant: item.esDecant,
        })),
      } as any)
      onSaved(mapVenta(response.data as any))
      showToast('Factura actualizada y stock ajustado.')
      onClose()
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'No se pudo actualizar la factura.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92dvh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="bg-noir-950 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-champagne-400" />
            <div>
              <h3 className="font-bold text-sm">Editar factura {sale.numeroFactura}</h3>
              <p className="text-[10px] text-noir-300">Los cambios recalculan ITBIS, total, caja y stock.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-noir-300 hover:text-white" disabled={saving}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs">
          {sale.cajaCerrada && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">
              Esta factura pertenece a un turno cerrado. Se actualizarán la factura, el stock y el movimiento de caja;
              el arqueo histórico no se recalcula.
            </div>
          )}
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cliente</label>
              <input className="w-full px-3 py-2.5 border border-slate-300 rounded-xl" value={client} onChange={(e) => setClient(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Método de pago</label>
              <select className="w-full px-3 py-2.5 border border-slate-300 rounded-xl" value={method} onChange={(e) => setMethod(e.target.value as Venta['metodoPago'])}>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Descuento (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl"
                value={discount}
                onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-3 py-2 flex items-center gap-2 border-b border-slate-200">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="flex-1 px-2.5 py-2 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="">Agregar producto a la factura...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.nombre} · ${product.precioVenta.toFixed(2)} · stock {product.stockActual}
                  </option>
                ))}
              </select>
              <button onClick={addProduct} disabled={!selectedProduct} className="px-3 py-2 rounded-lg bg-noir-950 text-white font-semibold flex items-center gap-1 disabled:opacity-40">
                <Plus className="w-3.5 h-3.5" /> Añadir
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-white text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-2">Producto</th>
                    <th className="px-3 py-2 w-20">Cantidad</th>
                    <th className="px-3 py-2 w-24">Precio</th>
                    <th className="px-3 py-2 w-24 text-right">Importe</th>
                    <th className="px-3 py-2 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.lineId}>
                      <td className="px-3 py-2">
                        <p className="font-semibold text-slate-700">
                          {item.nombreProducto}
                          {item.esDecant && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-champagne-100 text-champagne-800 text-[9px] font-bold uppercase align-middle">
                              Decant
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">{item.sku}</p>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={item.esDecant ? 5 : 1}
                          step={item.esDecant ? 5 : 1}
                          value={item.cantidad}
                          onChange={(e) =>
                            updateItem(item.lineId, {
                              cantidad: Math.max(
                                item.esDecant ? 5 : 1,
                                parseInt(e.target.value) || (item.esDecant ? 5 : 1),
                              ),
                            })
                          }
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg"
                        />
                        {item.esDecant && <p className="text-[9px] text-slate-400 mt-0.5">ml</p>}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.precioUnitario}
                          onChange={(e) => updateItem(item.lineId, { precioUnitario: Math.max(0, parseFloat(e.target.value) || 0) })}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg"
                        />
                        {item.esDecant && <p className="text-[9px] text-slate-400 mt-0.5">por ml</p>}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-700">${(item.cantidad * item.precioUnitario).toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => removeItem(item.lineId)} className="p-1 rounded text-rose-500 hover:bg-rose-50" title="Quitar de la factura">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="text-[11px] text-slate-500 space-y-1">
              <p>Subtotal: <span className="font-semibold text-slate-700">${subtotal.toFixed(2)}</span></p>
              <p>Descuento: <span className="font-semibold text-rose-600">-${discountAmount.toFixed(2)}</span></p>
              <p>ITBIS ({taxRate}%): <span className="font-semibold text-slate-700">${tax.toFixed(2)}</span></p>
              <p className="text-sm font-bold text-noir-900 pt-1">Total: ${total.toFixed(2)}</p>
            </div>
            {method === 'Efectivo' && (
              <div className="text-[11px]">
                <label className="text-slate-500 block mb-1">Efectivo recibido</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                  className="w-full sm:w-32 px-3 py-2 border border-slate-300 rounded-xl font-bold"
                />
                <p className="text-slate-500 mt-1">Cambio: <span className="font-semibold text-emerald-600">${Math.max(0, cashReceived - total).toFixed(2)}</span></p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 flex gap-2 shrink-0">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600">
            Cancelar
          </button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-noir-950 hover:bg-noir-800 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar factura
          </button>
        </div>
      </div>
    </div>
  )
}
