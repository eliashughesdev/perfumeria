import { Receipt, Trash2, CreditCard } from 'lucide-react'

interface CartPanelProps {
  cart: any[]
  updateQty: (id: number, delta: number) => void
  clearCart: () => void
  discountPct: number
  setDiscountPct: (v: number) => void
  clientName: string
  setClientName: (v: string) => void
  openCheckoutModal: () => void
  calculateTotals: () => { subtotal: number; discountAmount: number; tax: number; total: number }
}

export function CartPanel({ cart, updateQty, clearCart, discountPct, setDiscountPct, clientName, setClientName, openCheckoutModal, calculateTotals }: CartPanelProps) {
  const { subtotal, discountAmount, tax, total } = calculateTotals()
  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0)

  return (
    <div
      id="pos-cart-panel"
      className="fixed lg:static inset-x-0 bottom-0 z-20 lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col shadow-2xl lg:shadow-none max-h-[85vh] lg:max-h-full transition-transform duration-300"
    >
      <div
        onClick={() => {}}
        className="lg:hidden bg-plum-900 text-white px-4 py-3 flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-gold-400" />
          <span className="font-semibold text-sm">Ver Ticket Actual (<span id="mobile-cart-count">{totalItems}</span>)</span>
        </div>
        <span className="font-bold text-gold-300" id="mobile-cart-total">${total.toFixed(2)}</span>
      </div>

      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div>
          <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4 text-plum-800" />
            Orden #<span id="current-order-number">{String(Math.floor(Math.random() * 900000) + 100000).padStart(6, '0')}</span>
          </h2>
          <input
            type="text"
            id="pos-client-name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Cliente: Consumidor Final (Opcional)"
            className="mt-1 text-[11px] bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-700 w-48 focus:outline-none focus:border-plum-800"
          />
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Vaciar
        </button>
      </div>

      <div id="cart-items-container" className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[180px]">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8 text-slate-400">
            <div className="w-8 h-8 mb-2 text-slate-300">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <p className="text-xs font-medium">Selecciona perfumes del catálogo<br />para iniciar la factura</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.idProducto} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{item.nombreProducto || item.nombre}</p>
                <p className="text-[11px] text-slate-500">${item.precioUnitario.toFixed(2)} c/u</p>
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                <button onClick={() => updateQty(item.idProducto, -1)} className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded">-</button>
                <span className="text-xs font-bold w-5 text-center">{item.cantidad}</span>
                <button onClick={() => updateQty(item.idProducto, 1)} className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded">+</button>
              </div>
              <span className="text-xs font-bold text-plum-900 w-16 text-right">${(item.precioUnitario * item.cantidad).toFixed(2)}</span>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span id="cart-subtotal" className="font-medium text-slate-700">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>ITBIS / IVA (18%)</span>
            <span id="cart-tax" className="font-medium text-slate-700">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600 pt-1">
            <span>Descuento (%)</span>
            <input
              type="number"
              id="cart-discount"
              value={discountPct}
              min="0"
              max="50"
              onChange={(e) => setDiscountPct(parseFloat(e.target.value) || 0)}
              className="w-16 text-right px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
          <span className="text-sm font-bold text-slate-800">TOTAL A PAGAR</span>
          <span id="cart-total" className="text-2xl font-bold text-plum-900">${total.toFixed(2)}</span>
        </div>

        <button
          onClick={openCheckoutModal}
          id="btn-checkout"
          disabled={cart.length === 0}
          className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-lg shadow-plum-900/20 flex items-center justify-center gap-2 transition ${cart.length === 0 ? 'bg-slate-300 disabled:cursor-not-allowed' : 'bg-plum-900 hover:bg-plum-800'}`}
        >
          <CreditCard className="w-4 h-4 text-gold-400" />
          <span>Procesar Cobro</span>
        </button>
      </div>
    </div>
  )
}
