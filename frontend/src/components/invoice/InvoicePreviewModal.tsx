import { Printer, X } from 'lucide-react'
import { mapInvoice } from '@/services/mappers'
import type { InvoiceData } from '@/types'

interface InvoicePreviewModalProps {
  isOpen: boolean
  onClose: () => void
}

const money = (value: number) => `$${Number(value ?? 0).toFixed(2)}`

export function InvoicePreviewModal({ isOpen, onClose }: InvoicePreviewModalProps) {
  const raw = sessionStorage.getItem('last_invoice')
  const invoice: InvoiceData | null = raw ? mapInvoice(JSON.parse(raw)) : null

  const handlePrint = () => {
    const printable = document.getElementById('printable-invoice-area')
    if (!printable) return
    const printWindow = window.open('', '_blank', 'width=420,height=720')
    if (!printWindow) return
    const printableClone = printable.cloneNode(true) as HTMLElement
    printableClone.querySelectorAll('img').forEach((image) => {
      const src = image.getAttribute('src')
      if (src) image.setAttribute('src', new URL(src, window.location.href).href)
    })
    printWindow.document.write(`
      <html>
        <head>
          <title>${invoice?.factura.numero ?? 'Ticket'}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 8px; font-family: "Courier New", Courier, monospace; color: #111; background: #fff; }
            .ticket { width: ${invoice?.plantilla.anchoTicketMm ?? 80}mm; max-width: 100%; margin: 0 auto; font-size: 10px; line-height: 1.45; }
            .center { text-align: center; }
            .row { display: flex; justify-content: space-between; gap: 8px; }
            .bold { font-weight: 700; }
            .dashed { border-bottom: 1px dashed #777; padding-bottom: 6px; margin-bottom: 6px; }
            .logo { width: 56px; height: 56px; object-fit: cover; border-radius: 50%; margin: 0 auto 4px; display: block; }
            .muted { color: #555; }
            .small { font-size: 8px; }
            .barcode { height: 28px; width: 70%; margin: 8px auto 2px; background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px); }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${printableClone.outerHTML}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  return (
    <div
      id="invoice-preview-modal"
      className={`fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 ${isOpen ? 'flex items-center justify-center p-4' : 'hidden'}`}
    >
      <div className="bg-slate-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-300 flex flex-col max-h-[94vh]">
        <div className="bg-noir-950 text-white px-5 py-3.5 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-champagne-400" />
            <div>
              <h3 className="font-bold text-sm">Comprobante fiscal / Ticket POS</h3>
              <p className="text-[10px] text-noir-300">Vista previa lista para impresión térmica</p>
            </div>
          </div>
          <button onClick={onClose} className="text-noir-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 flex justify-center">
          {!invoice ? (
            <div className="bg-white w-full max-w-[340px] p-8 shadow-md border border-slate-300 text-center text-slate-500 text-xs">
              No hay datos de factura disponibles.
            </div>
          ) : (
            <div
              id="printable-invoice-area"
              className="ticket bg-white w-full p-5 shadow-md border border-slate-300 text-slate-900 font-mono text-[11px] leading-relaxed"
              style={{ maxWidth: `${Math.max(60, invoice.plantilla.anchoTicketMm)}mm` }}
            >
              <div className="center text-center border-b border-dashed border-slate-400 pb-3 mb-3">
                {invoice.plantilla.mostrarLogo && (
                  <img src={invoice.empresa.logoUrl || '/logo.jpeg'} alt="Nurfa" className="logo w-14 h-14 object-cover rounded-full mx-auto mb-1.5" />
                )}
                <h2 className="font-bold text-base tracking-wider uppercase">{invoice.plantilla.titulo || invoice.empresa.nombre}</h2>
                <p className="font-semibold">{invoice.empresa.razonSocial}</p>
                <p>RNC: {invoice.empresa.rnc}</p>
                <p>{invoice.empresa.direccion || ''}</p>
                <p>{invoice.empresa.ciudad || ''}, Rep. Dom.</p>
                <p>Tel: {invoice.empresa.telefono || ''}</p>
                {invoice.empresa.email && <p>{invoice.empresa.email}</p>}
                {invoice.empresa.redesSociales && <p>{invoice.empresa.redesSociales}</p>}
              </div>

              <div className="border-b border-dashed border-slate-400 pb-2.5 mb-2.5 space-y-0.5">
                <div className="flex justify-between">
                  <span className="font-bold">FACTURA N°:</span>
                  <span id="inv-number">{invoice.factura.numero}</span>
                </div>
                {invoice.plantilla.mostrarNCF && (
                  <div className="flex justify-between">
                    <span className="font-bold">NCF:</span>
                    <span>{invoice.factura.ncf || '—'}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>FECHA / HORA:</span>
                  <span id="inv-date">{new Date(invoice.factura.fecha).toLocaleString('es-DO')}</span>
                </div>
                {invoice.plantilla.mostrarCajero && (
                  <div className="flex justify-between">
                    <span>CAJERO(A):</span>
                    <span id="inv-cashier">{invoice.factura.cajero}</span>
                  </div>
                )}
                {invoice.plantilla.mostrarCliente && (
                  <div className="flex justify-between gap-3">
                    <span>CLIENTE:</span>
                    <span id="inv-client" className="font-bold text-right">{invoice.factura.cliente}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>MÉTODO PAGO:</span>
                  <span id="inv-method" className="uppercase">{invoice.factura.metodoPago}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-400 pb-2.5 mb-2.5">
                <div className="flex font-bold border-b border-slate-300 pb-1 mb-1.5 text-[10px]">
                  <span className="w-10">CANT</span>
                  <span className="flex-1">DESCRIPCIÓN</span>
                  <span className="w-16 text-right">IMPORTE</span>
                </div>
                <div id="inv-items-list" className="space-y-1.5">
                  {invoice.items.map((item, index) => (
                    <div key={`${item.nombre}-${index}`}>
                      <div className="flex gap-1">
                        <span className="w-10 font-bold">{item.cantidad}x</span>
                        <span className="flex-1 truncate">{item.nombre}</span>
                        <span className="w-16 text-right font-bold">{money(item.importe)}</span>
                      </div>
                      {invoice.plantilla.mostrarSKU && (
                        <div className="text-[9px] text-slate-500 pl-10">
                          SKU: {item.sku || 'N/A'} · P.Unit: {money(item.precioUnitario)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 border-b border-dashed border-slate-400 pb-3 mb-3">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span id="inv-subtotal">{money(invoice.totales.subtotal)}</span>
                </div>
                {invoice.totales.descuento > 0 && (
                  <div className="flex justify-between" id="inv-discount-row">
                    <span>DESCUENTO:</span>
                    <span id="inv-discount">-{money(invoice.totales.descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>ITBIS ({invoice.empresa.itbisPorcentaje}%):</span>
                  <span id="inv-tax">{money(invoice.totales.itbis)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
                  <span>TOTAL PAGADO:</span>
                  <span id="inv-total">{money(invoice.totales.total)}</span>
                </div>
                {invoice.totales.efectivoRecibido != null && (
                  <div className="flex justify-between pt-1" id="inv-cash-details">
                    <span>RECIBIDO: <span id="inv-received">{money(invoice.totales.efectivoRecibido)}</span></span>
                    <span>CAMBIO: <span id="inv-change">{money(invoice.totales.cambio ?? 0)}</span></span>
                  </div>
                )}
              </div>

              <div className="text-center text-[10px] space-y-1 text-slate-700">
                <p className="font-bold">{invoice.plantilla.agradecimiento}</p>
                <p>{invoice.plantilla.garantia}</p>
                <p>{invoice.plantilla.politica}</p>
                {invoice.plantilla.mostrarCodigoBarras && (
                  <div className="pt-2 flex flex-col items-center">
                    <div className="h-7 w-44 bg-[repeating-linear-gradient(90deg,#000,#000_2px,#fff_2px,#fff_4px,#000_4px,#000_5px,#fff_5px,#fff_8px)]" />
                    <span className="text-[9px] tracking-widest mt-1" id="inv-barcode-text">
                      *{invoice.factura.numero.replace(/^FAC-/, '')}*
                    </span>
                  </div>
                )}
                {invoice.plantilla.redSocial && <p className="pt-1">{invoice.plantilla.redSocial}</p>}
                {invoice.plantilla.pie && <p className="text-[9px]">{invoice.plantilla.pie}</p>}
              </div>
            </div>
          )}
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
            className="flex-1 py-2.5 px-4 rounded-xl bg-noir-950 hover:bg-noir-800 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition"
          >
            <Printer className="w-4 h-4 text-champagne-400" /> Imprimir Ticket
          </button>
        </div>
      </div>
    </div>
  )
}
