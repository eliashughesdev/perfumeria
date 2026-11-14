import { useEffect, useState } from 'react'
import { Building2, ReceiptText, Save, Loader2, ImageIcon, ShieldCheck } from 'lucide-react'
import { configService } from '@/services/api'
import { mapConfiguracionFactura, mapEmpresa } from '@/services/mappers'
import type { ConfiguracionEmpresa, ConfiguracionFactura } from '@/types'

interface ConfiguracionViewProps {
  showToast: (msg: string) => void
  onCompanyUpdated: (empresa: ConfiguracionEmpresa) => void
}

type Tab = 'empresa' | 'ticket'

export function ConfiguracionView({ showToast, onCompanyUpdated }: ConfiguracionViewProps) {
  const [tab, setTab] = useState<Tab>('empresa')
  const [empresa, setEmpresa] = useState<ConfiguracionEmpresa | null>(null)
  const [ticket, setTicket] = useState<ConfiguracionFactura | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([configService.get(), configService.getFactura()])
      .then(([empresaResponse, ticketResponse]) => {
        setEmpresa(mapEmpresa(empresaResponse.data as any))
        setTicket(mapConfiguracionFactura(ticketResponse.data as any))
      })
      .catch(() => showToast('No se pudo cargar la configuración.'))
      .finally(() => setLoading(false))
  }, [showToast])

  const saveEmpresa = async () => {
    if (!empresa) return
    setSaving(true)
    try {
      const response = await configService.update({
        NombreComercial: empresa.nombreComercial,
        RazonSocial: empresa.razonSocial,
        RNC: empresa.rnc,
        Direccion: empresa.direccion,
        Ciudad: empresa.ciudad,
        Telefono: empresa.telefono,
        Email: empresa.email,
        SitioWeb: empresa.sitioWeb,
        RedesSociales: empresa.redesSociales,
        LogoUrl: empresa.logoUrl,
        NCFSerie: empresa.ncfSerie,
        NCFSecuenciaActual: empresa.ncfSecuenciaActual,
        ITBISPorcentaje: empresa.itbisPorcentaje,
        MonedaSimbolo: empresa.monedaSimbolo,
      } as Partial<ConfiguracionEmpresa>)
      const updated = mapEmpresa(response.data as any)
      setEmpresa(updated)
      onCompanyUpdated(updated)
      showToast('Datos de la empresa actualizados.')
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'No se pudo guardar la empresa.')
    } finally {
      setSaving(false)
    }
  }

  const saveTicket = async () => {
    if (!ticket) return
    setSaving(true)
    try {
      const response = await configService.updateFactura({
        TituloTicket: ticket.tituloTicket,
        MensajeAgradecimiento: ticket.mensajeAgradecimiento,
        MensajeGarantia: ticket.mensajeGarantia,
        MensajePolitica: ticket.mensajePolitica,
        MensajePie: ticket.mensajePie,
        RedSocial: ticket.redSocial,
        PrefijoFactura: ticket.prefijoFactura,
        AnchoTicketMm: ticket.anchoTicketMm,
        MostrarLogo: ticket.mostrarLogo,
        MostrarSKU: ticket.mostrarSKU,
        MostrarCajero: ticket.mostrarCajero,
        MostrarCliente: ticket.mostrarCliente,
        MostrarNCF: ticket.mostrarNCF,
        MostrarCodigoBarras: ticket.mostrarCodigoBarras,
      } as Partial<ConfiguracionFactura>)
      setTicket(mapConfiguracionFactura(response.data as any))
      showToast('Diseño del ticket actualizado.')
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'No se pudo guardar el ticket.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !empresa || !ticket) {
    return (
      <section className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando configuración...
      </section>
    )
  }

  const field = 'w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-noir-800 bg-white'
  const label = 'text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1'

  return (
    <section id="view-configuracion" className="view-section flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Configuración del Sistema</h2>
        <p className="text-xs text-slate-500">Datos fiscales, identidad de la marca y diseño del ticket de facturación</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('empresa')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${tab === 'empresa' ? 'bg-noir-950 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          <Building2 className="w-4 h-4" /> Empresa y NCF
        </button>
        <button
          onClick={() => setTab('ticket')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${tab === 'ticket' ? 'bg-noir-950 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          <ReceiptText className="w-4 h-4" /> Ticket / Factura
        </button>
      </div>

      {tab === 'empresa' ? (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={label}>Nombre comercial</label>
                <input className={field} value={empresa.nombreComercial} onChange={(e) => setEmpresa({ ...empresa, nombreComercial: e.target.value })} />
              </div>
              <div>
                <label className={label}>Razón social</label>
                <input className={field} value={empresa.razonSocial} onChange={(e) => setEmpresa({ ...empresa, razonSocial: e.target.value })} />
              </div>
              <div>
                <label className={label}>RNC</label>
                <input className={field} value={empresa.rnc} onChange={(e) => setEmpresa({ ...empresa, rnc: e.target.value })} />
              </div>
              <div>
                <label className={label}>Teléfono</label>
                <input className={field} value={empresa.telefono ?? ''} onChange={(e) => setEmpresa({ ...empresa, telefono: e.target.value })} />
              </div>
              <div>
                <label className={label}>Correo</label>
                <input className={field} value={empresa.email ?? ''} onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })} />
              </div>
              <div>
                <label className={label}>Sitio web</label>
                <input className={field} value={empresa.sitioWeb ?? ''} onChange={(e) => setEmpresa({ ...empresa, sitioWeb: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Dirección</label>
                <input className={field} value={empresa.direccion ?? ''} onChange={(e) => setEmpresa({ ...empresa, direccion: e.target.value })} />
              </div>
              <div>
                <label className={label}>Ciudad</label>
                <input className={field} value={empresa.ciudad ?? ''} onChange={(e) => setEmpresa({ ...empresa, ciudad: e.target.value })} />
              </div>
              <div>
                <label className={label}>Redes sociales</label>
                <input className={field} value={empresa.redesSociales ?? ''} onChange={(e) => setEmpresa({ ...empresa, redesSociales: e.target.value })} />
              </div>
              <div>
                <label className={label}>Serie NCF</label>
                <input className={field} value={empresa.ncfSerie} onChange={(e) => setEmpresa({ ...empresa, ncfSerie: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label className={label}>Secuencia NCF actual</label>
                <input
                  type="number"
                  min="0"
                  className={field}
                  value={empresa.ncfSecuenciaActual}
                  onChange={(e) => setEmpresa({ ...empresa, ncfSecuenciaActual: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className={label}>ITBIS (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className={field}
                  value={empresa.itbisPorcentaje}
                  onChange={(e) => setEmpresa({ ...empresa, itbisPorcentaje: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className={label}>Símbolo de moneda</label>
                <input className={field} value={empresa.monedaSimbolo} onChange={(e) => setEmpresa({ ...empresa, monedaSimbolo: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Logo (URL o ruta)</label>
                <input className={field} value={empresa.logoUrl ?? ''} onChange={(e) => setEmpresa({ ...empresa, logoUrl: e.target.value })} />
              </div>
            </div>

            <button
              onClick={saveEmpresa}
              disabled={saving}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-noir-950 hover:bg-noir-800 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar empresa
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-3">Logo de la marca</p>
              <div className="w-36 h-36 mx-auto rounded-2xl overflow-hidden bg-noir-950 flex items-center justify-center ring-1 ring-champagne-300">
                {empresa.logoUrl ? (
                  <img src={empresa.logoUrl} alt={empresa.nombreComercial} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-champagne-400" />
                )}
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-3">Nurfa Essencial Perfumería</p>
              <p className="text-[11px] text-slate-400">Identidad visual para tickets y pantalla</p>
            </div>

            <div className="bg-champagne-50 rounded-2xl border border-champagne-200 p-4 text-[11px] text-noir-600 flex gap-2">
              <ShieldCheck className="w-4 h-4 text-champagne-700 shrink-0 mt-0.5" />
              <p>Los datos fiscales se usan en la factura y el reporte contable. Verifica el RNC y la secuencia NCF antes de emitir comprobantes.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3.5">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={label}>Título del ticket</label>
                <input className={field} value={ticket.tituloTicket} onChange={(e) => setTicket({ ...ticket, tituloTicket: e.target.value })} />
              </div>
              <div>
                <label className={label}>Prefijo de factura</label>
                <input className={field} value={ticket.prefijoFactura} onChange={(e) => setTicket({ ...ticket, prefijoFactura: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label className={label}>Ancho del ticket (mm)</label>
                <input
                  type="number"
                  min="40"
                  max="120"
                  className={field}
                  value={ticket.anchoTicketMm}
                  onChange={(e) => setTicket({ ...ticket, anchoTicketMm: parseInt(e.target.value) || 80 })}
                />
              </div>
              <div>
                <label className={label}>Red social</label>
                <input className={field} value={ticket.redSocial ?? ''} onChange={(e) => setTicket({ ...ticket, redSocial: e.target.value })} />
              </div>
              <div>
                <label className={label}>Mensaje de pie</label>
                <input className={field} value={ticket.mensajePie ?? ''} onChange={(e) => setTicket({ ...ticket, mensajePie: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Agradecimiento</label>
                <input className={field} value={ticket.mensajeAgradecimiento} onChange={(e) => setTicket({ ...ticket, mensajeAgradecimiento: e.target.value })} />
              </div>
              <div>
                <label className={label}>Garantía</label>
                <textarea rows={2} className={field} value={ticket.mensajeGarantia} onChange={(e) => setTicket({ ...ticket, mensajeGarantia: e.target.value })} />
              </div>
              <div>
                <label className={label}>Política de devolución</label>
                <textarea rows={2} className={field} value={ticket.mensajePolitica} onChange={(e) => setTicket({ ...ticket, mensajePolitica: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {[
                ['mostrarLogo', 'Mostrar logo'],
                ['mostrarSKU', 'Mostrar SKU'],
                ['mostrarCajero', 'Mostrar cajero'],
                ['mostrarCliente', 'Mostrar cliente'],
                ['mostrarNCF', 'Mostrar NCF'],
                ['mostrarCodigoBarras', 'Código de barras'],
              ].map(([key, labelText]) => (
                <label key={key} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean((ticket as any)[key])}
                    onChange={(e) => setTicket({ ...ticket, [key]: e.target.checked } as ConfiguracionFactura)}
                    className="accent-noir-900"
                  />
                  {labelText}
                </label>
              ))}
            </div>

            <button
              onClick={saveTicket}
              disabled={saving}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-noir-950 hover:bg-noir-800 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar ticket
            </button>
          </div>

          <div className="bg-slate-200 rounded-2xl p-4">
            <div className="bg-white mx-auto w-full max-w-[260px] p-4 shadow-md text-slate-900 font-mono text-[9px] leading-relaxed">
              <div className="text-center border-b border-dashed border-slate-400 pb-2 mb-2">
                {ticket.mostrarLogo && <img src={empresa.logoUrl || '/logo.jpeg'} alt="Logo" className="w-16 h-16 object-cover rounded-full mx-auto mb-1" />}
                <p className="font-bold text-[11px] uppercase">{ticket.tituloTicket}</p>
                <p>{empresa.razonSocial}</p>
                <p>RNC: {empresa.rnc}</p>
              </div>
              <div className="space-y-0.5 border-b border-dashed border-slate-400 pb-2 mb-2">
                <div className="flex justify-between"><span>FACTURA:</span><span>{ticket.prefijoFactura}-B02-000001</span></div>
                {ticket.mostrarNCF && <div className="flex justify-between"><span>NCF:</span><span>{empresa.ncfSerie}00000001</span></div>}
                {ticket.mostrarCajero && <div className="flex justify-between"><span>CAJERO:</span><span>Administradora</span></div>}
                {ticket.mostrarCliente && <div className="flex justify-between"><span>CLIENTE:</span><span>Consumidor Final</span></div>}
              </div>
              <div className="border-b border-dashed border-slate-400 pb-2 mb-2">
                <div className="flex justify-between font-bold"><span>1x Perfume</span><span>$100.00</span></div>
                {ticket.mostrarSKU && <p className="text-[8px] text-slate-500">SKU: NUR-000001</p>}
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between"><span>SUBTOTAL</span><span>$100.00</span></div>
                <div className="flex justify-between"><span>ITBIS ({empresa.itbisPorcentaje}%)</span><span>$18.00</span></div>
                <div className="flex justify-between font-bold text-[10px]"><span>TOTAL</span><span>$118.00</span></div>
              </div>
              <div className="text-center mt-3 space-y-0.5">
                <p className="font-bold">{ticket.mensajeAgradecimiento}</p>
                <p>{ticket.mensajeGarantia}</p>
                <p>{ticket.mensajePolitica}</p>
                {ticket.mostrarCodigoBarras && <div className="h-5 w-32 mx-auto bg-[repeating-linear-gradient(90deg,#000,#000_2px,#fff_2px,#fff_4px)] mt-2" />}
                <p className="pt-1">{ticket.redSocial}</p>
                <p>{ticket.mensajePie}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
