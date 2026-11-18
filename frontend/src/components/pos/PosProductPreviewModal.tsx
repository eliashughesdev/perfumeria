import { useEffect, useState } from 'react'
import { X, Plus, Sparkles } from 'lucide-react'
import type { Producto } from '@/types'

interface PosProductPreviewModalProps {
  isOpen: boolean
  product: Producto | null
  decantMode: boolean
  maxMl?: number
  onClose: () => void
  onAddUnit: (id: number) => void
  onAddDecant: (id: number, ml: number) => void
}

export function PosProductPreviewModal({
  isOpen,
  product,
  decantMode,
  maxMl,
  onClose,
  onAddUnit,
  onAddDecant,
}: PosProductPreviewModalProps) {
  const [ml, setMl] = useState(5)

  useEffect(() => {
    setMl(5)
  }, [product, isOpen])

  if (!isOpen || !product) return null

  const isDecant = decantMode && Boolean(product.di_cans)
  const perMl = product.precioPorMl ?? 0
  const bottleMl = product.mililitros ?? 0
  const availableMl =
    maxMl ?? (product.mililitrosDisponibles ?? 0) + product.stockActual * bottleMl
  const pricePer5 = perMl * 5
  const total = perMl * ml
  const canSell = availableMl >= 5 && perMl > 0 && ml <= availableMl
  const image = product.imagenesUrls?.split(',')[0]

  const handleMlChange = (raw: string) => {
    const parsed = parseInt(raw) || 0
    const stepped = Math.max(5, Math.round(parsed / 5) * 5)
    setMl(Math.min(stepped, Math.max(5, Math.floor(availableMl / 5) * 5)))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir-950/60 backdrop-blur-sm p-3 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[92dvh] overflow-y-auto animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {image ? (
            <img src={image} alt={product.nombre} className="w-full h-56 object-cover bg-slate-100" />
          ) : (
            <div className="w-full h-56 bg-gradient-to-br from-champagne-100 via-cream to-champagne-200 flex flex-col items-center justify-center">
              <div className="w-5 h-3 bg-champagne-500 rounded-t-sm" />
              <div className="w-16 h-20 rounded-lg bg-white/30 backdrop-blur-sm border border-white/50 flex items-center justify-center shadow-inner">
                <span className="font-serif text-xs font-bold tracking-widest uppercase text-noir-800">NURFA</span>
              </div>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 text-slate-600 hover:bg-white shadow"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
          {isDecant && (
            <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-noir-950/85 text-champagne-300 text-[10px] font-bold uppercase tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Decant
            </span>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-champagne-700 font-semibold">{product.categoria}</p>
            <h3 className="font-serif text-lg font-bold text-noir-950 leading-snug mt-0.5">{product.nombre}</h3>
          </div>

          {isDecant ? (
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Precio por 5 ml</p>
                  <p className="text-2xl font-bold text-noir-900">${pricePer5.toFixed(2)}</p>
                </div>
                <p className="text-[11px] text-slate-500 pb-1">${perMl.toFixed(2)} / ml</p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-600">Cantidad (ml)</label>
                  <span className="text-[10px] text-slate-400">{availableMl} ml disponibles</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMl((current) => Math.max(5, current - 5))}
                    className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={ml}
                    onChange={(e) => handleMlChange(e.target.value)}
                    className="flex-1 text-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-noir-800"
                  />
                  <button
                    onClick={() => setMl((current) => Math.min(Math.max(5, Math.floor(availableMl / 5) * 5), current + 5))}
                    className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">Total</span>
                  <span className="text-lg font-bold text-noir-900">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => onAddDecant(product.id, ml)}
                disabled={!canSell}
                className="w-full py-3 rounded-xl bg-noir-950 hover:bg-noir-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4 text-champagne-400" />
                Agregar {ml} ml al ticket
              </button>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-noir-900">${product.precioVenta.toFixed(2)}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{product.descripcion || 'Sin descripción disponible.'}</p>
              <button
                onClick={() => onAddUnit(product.id)}
                disabled={product.stockActual <= 0}
                className="w-full py-3 rounded-xl bg-noir-950 hover:bg-noir-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4 text-champagne-400" />
                {product.stockActual <= 0 ? 'Sin existencia' : 'Agregar al ticket'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
