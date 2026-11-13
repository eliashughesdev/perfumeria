import { X, ShoppingBag } from 'lucide-react'

interface ProductDetailModalProps {
  isOpen: boolean
  product: any | null
  onClose: () => void
  isAdmin: boolean
  onAddToCart: (id: number) => void
  isRoleCajero: boolean
}

export function ProductDetailModal({ isOpen, product, onClose, isAdmin, onAddToCart, isRoleCajero }: ProductDetailModalProps) {
  if (!product) return null

  return (
    <div
      id="product-detail-modal"
      className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 ${isOpen ? 'flex items-center justify-center p-4 no-print' : 'hidden no-print'}`}
    >
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="bg-plum-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-gold-400/20 text-gold-300 font-mono text-[11px] font-bold" id="detail-sku">
              {product.sku}
            </span>
            <span className="text-xs text-plum-200 uppercase tracking-wider font-semibold" id="detail-category">
              {product.categoria}
            </span>
          </div>
          <button onClick={onClose} className="text-plum-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
            <div id="detail-image-container" className="w-36 h-36 rounded-2xl shrink-0 overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center bg-slate-50">
              <div className="w-full h-full bg-gradient-to-br from-plum-100 to-plum-200 flex flex-col items-center justify-center">
                <div className="w-5 h-3 bg-gold-400 rounded-t-sm"></div>
                <div className="w-14 h-18 rounded-lg bg-white/20 backdrop-blur-xs border border-white/40 flex items-center justify-center shadow-inner">
                  <span className="font-serif text-xs font-bold tracking-widest uppercase text-plum-800">EAU</span>
                </div>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <h3 id="detail-name" className="font-serif text-xl font-bold text-slate-900 leading-snug">
                {product.nombre}
              </h3>
              <p id="detail-description" className="text-xs text-slate-600 leading-relaxed">
                {product.descripcion || 'Sin descripción registrada.'}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <div className="bg-plum-50 px-3 py-1.5 rounded-xl border border-plum-100">
                  <span className="text-[10px] text-slate-500 block uppercase">Precio Venta</span>
                  <span id="detail-price" className="text-base font-bold text-plum-900">${product.precioVenta.toFixed(2)}</span>
                </div>
                <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase">Existencia</span>
                  <span id="detail-stock" className="text-base font-bold text-slate-800">{product.stockActual} uds.</span>
                </div>
                {isAdmin && (
                  <div id="detail-cost-box" className="bg-amber-50/70 px-3 py-1.5 rounded-xl border border-amber-200/70">
                    <span className="text-[10px] text-amber-700 block uppercase">Costo (Admin)</span>
                    <span id="detail-cost" className="text-base font-bold text-amber-900">${(product.costo ?? 0).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isAdmin && (
            <div id="detail-edit-desc-box" className="pt-3 border-t border-slate-100">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Editar Descripción / Notas Olfativas</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="detail-edit-desc-input"
                  defaultValue={product.descripcion || ''}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-plum-800"
                />
                <button className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition">
                  Actualizar
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition">
              Cerrar
            </button>
            <button
              onClick={() => {
                onAddToCart(product.id)
              }}
              className="flex-1 py-3 rounded-xl bg-plum-900 hover:bg-plum-800 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition"
            >
              <ShoppingBag className="w-4 h-4 text-gold-400" /> Agregar a la Factura
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
