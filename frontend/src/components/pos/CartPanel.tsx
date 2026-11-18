import { Receipt, Trash2, CreditCard, Lock } from 'lucide-react'
import { useMemo, useState } from 'react'

interface CartItem {
  idProducto: number
  nombreProducto?: string | null
  nombre?: string
  precioUnitario: number
  cantidad: number
  esDecant?: boolean
}

interface CartPanelProps {
  cart: CartItem[]
  updateQty: (id: number, delta: number, esDecant?: boolean) => void
  clearCart: () => void
  discountPct: number
  setDiscountPct: (v: number) => void
  clientName: string
  setClientName: (v: string) => void
  openCheckoutModal: () => void
  calculateTotals: () => { subtotal: number; discountAmount: number; tax: number; total: number }
  taxRate: number
  canDiscount: boolean
}

export function CartPanel({
  cart,
  updateQty,
  clearCart,
  discountPct,
  setDiscountPct,
  clientName,
  setClientName,
  openCheckoutModal,
  calculateTotals,
  taxRate,
  canDiscount,
}: CartPanelProps) {
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false)
  const { subtotal, discountAmount, tax, total } = calculateTotals()
  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0)
  const orderNumber = useMemo(() => String(Date.now()).slice(-6), [])

  const handleCheckout = () => {
    setIsMobileCartOpen(false)
    openCheckoutModal()
  }

  return (
    <>
      <div
        id="pos-cart-panel"
        className={`bg-white flex-col ${
          isMobileCartOpen ? 'fixed inset-0 z-50 flex h-dvh' : 'hidden'
        } lg:flex lg:static lg:inset-auto lg:z-auto lg:h-auto lg:w-96 lg:border-l lg:border-slate-200 lg:shadow-none`}
      >
        <div className="lg:hidden bg-noir-950 text-white px-4 py-3 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => setIsMobileCartOpen(false)}
            className="flex items-center gap-1.5 text-xs font-semibold text-champagne-200 hover:text-white transition"
          >
            ← Volver al catálogo
          </button>
          <span className="text-xs font-bold text-champagne-300">
            {totalItems} art. · ${total.toFixed(2)}
          </span>
        </div>

        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 gap-3">
          <div className="min-w-0">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-noir-800" />
              Orden #<span id="current-order-number">{orderNumber}</span>
            </h2>
            <input
              type="text"
              id="pos-client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Cliente: Consumidor Final"
              className="mt-1 text-[11px] bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 w-full max-w-[220px] focus:outline-none focus:border-champagne-500"
            />
          </div>
          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            className="text-xs text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1 disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" /> Vaciar
          </button>
        </div>

        <div id="cart-items-container" className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[180px]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8 text-slate-400">
              <Receipt className="w-8 h-8 mb-2 text-slate-300" />
              <p className="text-xs font-medium">
                Selecciona perfumes del catálogo
                <br />
                para iniciar la factura
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={`${item.idProducto}-${item.esDecant ? 'dec' : 'reg'}`} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {item.nombreProducto || item.nombre}
                    {item.esDecant && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded bg-champagne-100 text-champagne-800 text-[9px] font-bold uppercase align-middle">
                        Decant
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    ${item.precioUnitario.toFixed(2)} {item.esDecant ? '/ml' : 'c/u'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                  <button onClick={() => updateQty(item.idProducto, item.esDecant ? -5 : -1, item.esDecant)} className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded">
                    -
                  </button>
                  <span className="text-xs font-bold w-10 text-center">
                    {item.cantidad}
                    {item.esDecant ? ' ml' : ''}
                  </span>
                  <button onClick={() => updateQty(item.idProducto, item.esDecant ? 5 : 1, item.esDecant)} className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded">
                    +
                  </button>
                </div>
                <span className="text-xs font-bold text-noir-900 w-16 text-right">${(item.precioUnitario * item.cantidad).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 shrink-0">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span id="cart-subtotal" className="font-medium text-slate-700">${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Descuento aplicado</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>ITBIS ({taxRate.toFixed(0)}%)</span>
              <span id="cart-tax" className="font-medium text-slate-700">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 pt-1">
              <span className="flex items-center gap-1">
                Descuento (%)
                {!canDiscount && <Lock className="w-3 h-3 text-slate-400" />}
              </span>
              <input
                type="number"
                id="cart-discount"
                value={discountPct}
                min="0"
                max="50"
                disabled={!canDiscount}
                onChange={(e) => setDiscountPct(Math.min(50, Math.max(0, parseFloat(e.target.value) || 0)))}
                className="w-16 text-right px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50"
                title={canDiscount ? 'Descuento autorizado' : 'Sin permiso para descuentos'}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
            <span className="text-sm font-bold text-slate-800">TOTAL A PAGAR</span>
            <span id="cart-total" className="text-2xl font-bold text-noir-900">${total.toFixed(2)}</span>
          </div>

          <button
            onClick={handleCheckout}
            id="btn-checkout"
            disabled={cart.length === 0}
            className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-lg shadow-noir-900/20 flex items-center justify-center gap-2 transition ${cart.length === 0 ? 'bg-slate-300 disabled:cursor-not-allowed' : 'bg-noir-950 hover:bg-noir-800'}`}
          >
            <CreditCard className="w-4 h-4 text-champagne-400" />
            <span>Procesar Cobro</span>
          </button>
        </div>
      </div>

      {!isMobileCartOpen && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 h-14 z-30 bg-plum-900 text-white px-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 min-w-0">
            <Receipt className="w-5 h-5 text-champagne-400 shrink-0" />
            <span className="text-xs font-semibold whitespace-nowrap">{totalItems} art.</span>
            <span className="text-base font-bold text-champagne-300 whitespace-nowrap">${total.toFixed(2)}</span>
          </div>
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="px-4 py-2 rounded-lg bg-champagne-400 hover:bg-champagne-300 text-noir-950 text-xs font-bold shadow-sm transition whitespace-nowrap"
          >
            Ver Ticket
          </button>
        </div>
      )}
    </>
  )
}
