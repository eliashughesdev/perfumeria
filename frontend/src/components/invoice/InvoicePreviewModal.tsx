import { Printer, X } from 'lucide-react'

interface InvoicePreviewModalProps {
  isOpen: boolean
  onClose: () => void
}

export function InvoicePreviewModal({ isOpen, onClose }: InvoicePreviewModalProps) {
  const handlePrint = () => {
    window.print()
  }

  const raw = sessionStorage.getItem('last_invoice')
  const invoice = raw ? JSON.parse(raw) : null

  const formatMoney = (v: number) => `$${v.toFixed(2)}`

  return (
    <div
      id="invoice-preview-modal"
      className={`fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 ${isOpen ? 'flex items-center justify-center p-4' : 'hidden'}`}
    >
      <div className="bg-slate-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-300 flex flex-col max-h-[92vh]">
        <div className="bg-plum-950 text-white px-5 py-3.5 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-gold-400" />
            <h3 className="font-bold text-sm">Comprobante Fiscal / Ticket POS</h3>
          </div>
          <button onClick={onClose} className="text-plum-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 flex justify-center">
          <div
            id="printable-invoice-area"
            className="bg-white w-full max-w-[340px] p-6 shadow-md border border-slate-300 text-slate-900 font-mono text-[11px] leading-relaxed"
          >
            {!invoice ? (
              <div className="text-center py-10 text-slate-500">No hay datos de factura disponibles.</div>
            ) : (
              <>
                <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
                  <h2 className="font-bold text-base tracking-wider uppercase">{invoice.empresa.nombre}</h2>
                  <p className="font-semibold">{invoice.empresa.razonSocial}</p>
                  <p>RNC: {invoice.empresa.rnc}</p>
                  <p>{invoice.empresa.direccion || ''}</p>
                  <p>{invoice.empresa.ciudad || ''}, Rep. Dom.</p>
                  <p>Tel: {invoice.empresa.telefono || ''}</p>
                  <p>IG: @lessenceperfumeria.rd</p>
                </div>

                <div className="border-b border-dashed border-slate-400 pb-2.5 mb-2.5 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="font-bold">FACTURA N°:</span>
                    <span id="inv-number">{invoice.factura.numero}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">NCF:</span>
                    <span>{invoice.factura.ncf || 'B0200000148'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FECHA / HORA:</span>
                    <span id="inv-date">{new Date(invoice.factura.fecha).toLocaleString('es-DO')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CAJERO(A):</span>
                    <span id="inv-cashier">{invoice.factura.cajero}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CLIENTE:</span>
                    <span id="inv-client" className="font-bold">{invoice.factura.cliente}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MÉTODO PAGO:</span>
                    <span id="inv-method" className="uppercase">{invoice.factura.metodoPago}</span>
                  </div>
                </div>

                <div className="border-b border-dashed border-slate-400 pb-2.5 mb-2.5">
                  <div className="grid grid-cols-12 font-bold border-b border-slate-300 pb-1 mb-1.5 text-[10px]">
                    <span className="col-span-2">CANT</span>
                    <span className="col-span-6">DESCRIPCIÓN</span>
                    <span className="col-span-4 text-right">IMPORTE</span>
                  </div>
                  <div id="inv-items-list" className="space-y-1.5">
                    {invoice.items.map((item: any, i: number) => (
                      <div key={i}>
                        <div className="grid grid-cols-12">
                          <span className="col-span-2 font-bold">{item.cantidad}x</span>
                          <span className="col-span-6 truncate">{item.nombre}</span>
                          <span className="col-span-4 text-right font-bold">{formatMoney(item.importe)}</span>
                        </div>
                        <div className="text-[9px] text-slate-500 pl-6">SKU: {item.sku || 'N/A'} | P.Unit: {formatMoney(item.precioUnitario)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 border-b border-dashed border-slate-400 pb-3 mb-3">
                  <div className="flex justify-between">
                    <span>SUBTOTAL:</span>
                    <span id="inv-subtotal">{formatMoney(invoice.totales.subtotal)}</span>
                  </div>
                  {invoice.totales.descuento > 0 && (
                    <div className="flex justify-between" id="inv-discount-row">
                      <span>DESCUENTO:</span>
                      <span id="inv-discount">-${formatMoney(invoice.totales.descuento)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>ITBIS (18%):</span>
                    <span id="inv-tax">{formatMoney(invoice.totales.itbis)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
                    <span>TOTAL PAGADO:</span>
                    <span id="inv-total">{formatMoney(invoice.totales.total)}</span>
                  </div>
                  {invoice.totales.efectivoRecibido != null && (
                    <div className="flex justify-between pt-1" id="inv-cash-details">
                      <span>RECIBIDO: <span id="inv-received">{formatMoney(invoice.totales.efectivoRecibido)}</span></span>
                      <span>CAMBIO: <span id="inv-change">{formatMoney(invoice.totales.cambio ?? 0)}</span></span>
                    </div>
                  )}
                </div>

                <div className="text-center text-[10px] space-y-1 text-slate-700">
                  <p className="font-bold">¡GRACIAS POR PREFERIRNOS!</p>
                  <p>Conserve este ticket para fines de garantía.</p>
                  <p>No se aceptan devoluciones en perfumes destapados o sin su celofán original.</p>
                  <div className="pt-2 flex flex-col items-center">
                    <div className="h-7 w-44 bg-[repeating-linear-gradient(90deg,#000,#000_2px,#fff_2px,#fff_4px,#000_4px,#000_5px,#fff_5px,#fff_8px)]"></div>
                    <span className="text-[9px] tracking-widest mt-1" id="inv-barcode-text">{`*${invoice.factura.numero.replace('FAC-', '')}*`}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex gap-3 shrink-0 no-print">
          <button
            onClick={() => {
              sessionStorage.removeItem('last_invoice')
              onClose()
            }}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
          >
            Nueva Venta
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl bg-plum-900 hover:bg-plum-800 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition"
          >
            <Printer className="w-4 h-4 text-gold-400" /> Imprimir Ticket
          </button>
        </div>
      </div>
    </div>
  )
}
