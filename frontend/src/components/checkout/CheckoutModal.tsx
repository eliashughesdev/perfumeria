import { Banknote, CreditCard, Smartphone, Receipt, X } from 'lucide-react'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  total: number
  paymentMethod: 'Efectivo' | 'Tarjeta' | 'Transferencia'
  setPaymentMethod: (m: 'Efectivo' | 'Tarjeta' | 'Transferencia') => void
  cashReceived: number
  setCashReceived: (v: number) => void
  calculateChange: () => number
  onComplete: () => void
}

export function CheckoutModal({ isOpen, onClose, total, paymentMethod, setPaymentMethod, cashReceived, setCashReceived, calculateChange, onComplete }: CheckoutModalProps) {
  const change = calculateChange()

  const selectMethod = (m: 'Efectivo' | 'Tarjeta' | 'Transferencia') => {
    setPaymentMethod(m)
  }

  return (
    <div
      id="checkout-modal"
      className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 ${isOpen ? 'flex items-center justify-center p-4' : 'hidden'}`}
    >
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="bg-plum-900 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-base">Finalizar Facturación</h3>
          <button onClick={onClose} className="text-plum-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-200">
            <span className="text-xs text-slate-500 uppercase font-semibold">Total a Cobrar</span>
            <p id="modal-total-amount" className="text-3xl font-bold text-plum-900 mt-1">${total.toFixed(2)}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Método de Pago</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'Efectivo' as 'Efectivo' | 'Tarjeta' | 'Transferencia', label: 'Efectivo', icon: <Banknote className="w-4 h-4" /> },
                { key: 'Tarjeta' as 'Efectivo' | 'Tarjeta' | 'Transferencia', label: 'Tarjeta', icon: <CreditCard className="w-4 h-4" /> },
                { key: 'Transferencia' as 'Efectivo' | 'Tarjeta' | 'Transferencia', label: 'Transf.', icon: <Smartphone className="w-4 h-4" /> },
              ].map((method) => {
                const isSelected = paymentMethod === method.key
                return (
                  <button
                    key={method.key}
                    onClick={() => selectMethod(method.key)}
                    className={`pay-method-btn py-2.5 px-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition ${isSelected ? 'border-2 border-plum-900 bg-plum-50 text-plum-900 font-bold' : 'border border-slate-200 text-slate-600'}`}
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
                onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-plum-800"
              />
              <div className="flex justify-between text-xs mt-2 font-semibold">
                <span className="text-slate-500">Cambio / Devuelta:</span>
                <span id="cash-change-amount" className="text-emerald-600 text-sm">${change.toFixed(2)}</span>
              </div>
            </div>
          )}

          <button
            onClick={onComplete}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
          >
            <Receipt className="w-4 h-4" /> Generar Factura y Vista Previa
          </button>
        </div>
      </div>
    </div>
  )
}
