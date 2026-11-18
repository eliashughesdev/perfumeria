import { Banknote, CreditCard, Smartphone, Receipt, X, Loader2 } from 'lucide-react'

type PaymentMethod = 'Efectivo' | 'Tarjeta' | 'Transferencia'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  total: number
  paymentMethod: PaymentMethod
  setPaymentMethod: (m: PaymentMethod) => void
  cashReceived: number
  setCashReceived: (v: number) => void
  calculateChange: () => number
  onComplete: () => void
  isProcessing: boolean
}

export function CheckoutModal({
  isOpen,
  onClose,
  total,
  paymentMethod,
  setPaymentMethod,
  cashReceived,
  setCashReceived,
  calculateChange,
  onComplete,
  isProcessing,
}: CheckoutModalProps) {
  const change = calculateChange()
  const insufficientCash = paymentMethod === 'Efectivo' && cashReceived < total
  const quickAmounts = [Math.ceil(total), Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500, Math.ceil(total / 1000) * 1000]
    .filter((value, index, list) => value >= total && list.indexOf(value) === index)
    .slice(0, 4)

  return (
    <div
      id="checkout-modal"
      className={`fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 ${isOpen ? 'flex items-center justify-center p-3 sm:p-4' : 'hidden'}`}
    >
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[92dvh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="bg-noir-950 text-white px-4 sm:px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-base">Finalizar Facturación</h3>
          <button onClick={onClose} className="text-noir-300 hover:text-white" disabled={isProcessing}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="bg-gradient-to-br from-champagne-50 to-cream p-4 rounded-xl text-center border border-champagne-200">
            <span className="text-[11px] text-noir-500 uppercase font-semibold tracking-wider">Total a Cobrar</span>
            <p id="modal-total-amount" className="text-3xl font-bold text-noir-950 mt-1">${total.toFixed(2)}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Método de Pago</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'Efectivo' as PaymentMethod, label: 'Efectivo', icon: <Banknote className="w-4 h-4" /> },
                { key: 'Tarjeta' as PaymentMethod, label: 'Tarjeta', icon: <CreditCard className="w-4 h-4" /> },
                { key: 'Transferencia' as PaymentMethod, label: 'Transf.', icon: <Smartphone className="w-4 h-4" /> },
              ].map((method) => {
                const isSelected = paymentMethod === method.key
                return (
                  <button
                    key={method.key}
                    onClick={() => setPaymentMethod(method.key)}
                    className={`pay-method-btn py-2.5 px-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition ${isSelected ? 'border-2 border-noir-950 bg-champagne-50 text-noir-950 font-bold' : 'border border-slate-200 text-slate-600 hover:border-champagne-400'}`}
                  >
                    {method.icon}
                    <span>{method.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {paymentMethod === 'Efectivo' && (
            <div id="cash-received-box">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Efectivo Recibido ($)</label>
              <input
                type="number"
                id="cash-received-input"
                value={cashReceived}
                min={0}
                onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-noir-800"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCashReceived(amount)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-champagne-100 text-[11px] font-semibold text-slate-700"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs mt-2 font-semibold">
                <span className="text-slate-500">Cambio / Devuelta:</span>
                <span id="cash-change-amount" className={insufficientCash ? 'text-rose-600 text-sm' : 'text-emerald-600 text-sm'}>
                  ${change.toFixed(2)}
                </span>
              </div>
              {insufficientCash && <p className="text-[11px] text-rose-600 mt-1">El efectivo recibido es menor al total.</p>}
            </div>
          )}

          <button
            onClick={onComplete}
            disabled={isProcessing || insufficientCash}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
            {isProcessing ? 'Procesando venta...' : 'Generar Factura y Vista Previa'}
          </button>
        </div>
      </div>
    </div>
  )
}
