import { useEffect, useState } from 'react'
import { X, ShoppingBag, Save, Loader2, Lock, TrendingUp } from 'lucide-react'
import type { Producto } from '@/types'

interface ProductDetailModalProps {
  isOpen: boolean
  product: Producto | null
  onClose: () => void
  canEdit: boolean
  canViewCost: boolean
  onAddToCart: (id: number) => void
  onUpdate: (id: number, data: Partial<Producto>) => Promise<void>
}

export function ProductDetailModal({
  isOpen,
  product,
  onClose,
  canEdit,
  canViewCost,
  onAddToCart,
  onUpdate,
}: ProductDetailModalProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    descripcion: '',
    precioVenta: 0,
    stockActual: 0,
    stockMinimo: 4,
    costo: 0,
    imagenUrl: '',
  })

  useEffect(() => {
    if (!product) return
    setEditing(false)
    setForm({
      descripcion: product.descripcion ?? '',
      precioVenta: product.precioVenta,
      stockActual: product.stockActual,
      stockMinimo: product.stockMinimo,
      costo: product.costo ?? 0,
      imagenUrl: product.imagenUrl ?? '',
    })
  }, [product])

  if (!product) return null

  const margin = form.precioVenta > 0 ? ((form.precioVenta - form.costo) / form.precioVenta) * 100 : 0
  const lowStock = product.stockActual <= product.stockMinimo

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate(product.id, {
        Descripcion: form.descripcion,
        PrecioVenta: form.precioVenta,
        StockActual: form.stockActual,
        StockMinimo: form.stockMinimo,
        ...(canViewCost ? { Costo: form.costo } : {}),
        ImagenUrl: form.imagenUrl || null,
      } as Partial<Producto>)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const displayImage = form.imagenUrl || product.imagenUrl

  return (
    <div
      id="product-detail-modal"
      className={`fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 ${isOpen ? 'flex items-center justify-center p-4 no-print' : 'hidden no-print'}`}
    >
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        <div className="bg-noir-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-champagne-400/20 text-champagne-300 font-mono text-[11px] font-bold" id="detail-sku">
              {product.sku}
            </span>
            <span className="text-xs text-noir-300 uppercase tracking-wider font-semibold" id="detail-category">
              {product.categoria}
            </span>
          </div>
          <button onClick={onClose} className="text-noir-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
            <div id="detail-image-container" className="w-36 h-36 rounded-2xl shrink-0 overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center bg-gradient-to-br from-champagne-100 to-champagne-200">
              {displayImage ? (
                <img src={displayImage} alt={product.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-5 h-3 bg-champagne-500 rounded-t-sm" />
                  <div className="w-14 h-20 rounded-lg bg-white/30 backdrop-blur-sm border border-white/50 flex items-center justify-center shadow-inner">
                    <span className="font-serif text-xs font-bold tracking-widest uppercase text-noir-800">NURFA</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
              <h3 id="detail-name" className="font-serif text-xl font-bold text-slate-900 leading-snug">
                {product.nombre}
              </h3>
              <p id="detail-description" className="text-xs text-slate-600 leading-relaxed">
                {product.descripcion || 'Sin descripción registrada.'}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <div className="bg-champagne-50 px-3 py-1.5 rounded-xl border border-champagne-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Precio Venta</span>
                  <span id="detail-price" className="text-base font-bold text-noir-900">${product.precioVenta.toFixed(2)}</span>
                </div>
                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Existencia</span>
                  <span id="detail-stock" className={`text-base font-bold ${lowStock ? 'text-amber-700' : 'text-slate-800'}`}>
                    {product.stockActual} uds.
                  </span>
                </div>
                {canViewCost && (
                  <div id="detail-cost-box" className="bg-amber-50/70 px-3 py-1.5 rounded-xl border border-amber-200/70">
                    <span className="text-[10px] text-amber-700 block uppercase">Costo (Admin)</span>
                    <span id="detail-cost" className="text-base font-bold text-amber-900">${(product.costo ?? 0).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {canViewCost && (
                <p className="text-[11px] text-emerald-700 flex items-center justify-center sm:justify-start gap-1">
                  <TrendingUp className="w-3 h-3" /> Margen actual: {margin.toFixed(1)}%
                </p>
              )}
            </div>
          </div>

          {canEdit && (
            <div id="detail-edit-box" className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">Ficha editable (Admin)</label>
                <button
                  onClick={() => setEditing((value) => !value)}
                  className="text-[11px] font-semibold text-champagne-700 hover:underline"
                >
                  {editing ? 'Cancelar edición' : 'Editar ficha'}
                </button>
              </div>

              {editing ? (
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold uppercase">Descripción / Notas</label>
                    <textarea
                      value={form.descripcion}
                      onChange={(e) => setForm((current) => ({ ...current, descripcion: e.target.value }))}
                      rows={2}
                      className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-noir-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <label className="text-[10px] text-slate-500 font-semibold uppercase">
                      Precio venta
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.precioVenta}
                        onChange={(e) => setForm((current) => ({ ...current, precioVenta: parseFloat(e.target.value) || 0 }))}
                        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                      />
                    </label>
                    <label className="text-[10px] text-slate-500 font-semibold uppercase">
                      Stock actual
                      <input
                        type="number"
                        min="0"
                        value={form.stockActual}
                        onChange={(e) => setForm((current) => ({ ...current, stockActual: parseInt(e.target.value) || 0 }))}
                        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                      />
                    </label>
                    <label className="text-[10px] text-slate-500 font-semibold uppercase">
                      Stock mínimo
                      <input
                        type="number"
                        min="0"
                        value={form.stockMinimo}
                        onChange={(e) => setForm((current) => ({ ...current, stockMinimo: parseInt(e.target.value) || 0 }))}
                        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                      />
                    </label>
                    {canViewCost && (
                      <label className="text-[10px] text-slate-500 font-semibold uppercase">
                        Costo
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.costo}
                          onChange={(e) => setForm((current) => ({ ...current, costo: parseFloat(e.target.value) || 0 }))}
                          className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                        />
                      </label>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold uppercase">URL de imagen</label>
                    <input
                      type="text"
                      value={form.imagenUrl}
                      onChange={(e) => setForm((current) => ({ ...current, imagenUrl: e.target.value }))}
                      placeholder="https://... o /ruta.jpg"
                      className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-2.5 rounded-xl bg-noir-950 hover:bg-noir-800 text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar cambios
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Edita precio, stock, costo y notas desde la ficha.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition">
              Cerrar
            </button>
            <button
              onClick={() => onAddToCart(product.id)}
              disabled={product.stockActual <= 0}
              className="flex-1 py-3 rounded-xl bg-noir-950 hover:bg-noir-800 disabled:opacity-50 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition"
            >
              <ShoppingBag className="w-4 h-4 text-champagne-400" /> Agregar a la Factura
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
