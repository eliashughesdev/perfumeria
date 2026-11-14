import type {
  ConfiguracionEmpresa,
  ConfiguracionFactura,
  ContabilidadReporte,
  InvoiceData,
  MovimientoCaja,
  Producto,
  ResumenCaja,
  Usuario,
  Venta,
} from '@/types'

type Raw = Record<string, any>

const value = (raw: Raw | null | undefined, ...keys: string[]) => {
  if (!raw) return undefined
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) return raw[key]
  }
  return undefined
}

const number = (raw: Raw | null | undefined, ...keys: string[]) => Number(value(raw, ...keys) ?? 0)

const optionalNumber = (raw: Raw | null | undefined, ...keys: string[]) => {
  const current = value(raw, ...keys)
  return current === undefined || current === null ? null : Number(current)
}

const bool = (raw: Raw | null | undefined, ...keys: string[]) => Boolean(value(raw, ...keys) ?? false)

export function mapProducto(raw: Raw): Producto {
  const costo = value(raw, 'Costo', 'costo')
  return {
    id: Number(value(raw, 'Id', 'id') ?? 0),
    sku: String(value(raw, 'SKU', 'sku') ?? ''),
    nombre: String(value(raw, 'Nombre', 'nombre') ?? ''),
    descripcion: value(raw, 'Descripcion', 'descripcion') ?? null,
    categoria: String(value(raw, 'Categoria', 'categoria') ?? 'Damas'),
    costo: costo === undefined || costo === null ? null : Number(costo),
    precioVenta: number(raw, 'PrecioVenta', 'precioVenta'),
    stockActual: number(raw, 'StockActual', 'stockActual'),
    stockMinimo: number(raw, 'StockMinimo', 'stockMinimo'),
    imagenUrl: value(raw, 'ImagenUrl', 'imagenUrl') ?? null,
    activo: bool(raw, 'Activo', 'activo'),
    fechaCreacion: value(raw, 'FechaCreacion', 'fechaCreacion'),
    fechaActualizacion: value(raw, 'FechaActualizacion', 'fechaActualizacion'),
  }
}

export function mapUsuario(raw: Raw): Usuario {
  return {
    id: Number(value(raw, 'Id', 'id') ?? 0),
    nombre: String(value(raw, 'Nombre', 'nombre') ?? ''),
    email: String(value(raw, 'Email', 'email') ?? ''),
    rol: value(raw, 'Rol', 'rol') ?? 'ROLE_CAJERO',
    activo: bool(raw, 'Activo', 'activo'),
    permisos: value(raw, 'Permisos', 'permisos') ?? [],
    fechaCreacion: value(raw, 'FechaCreacion', 'fechaCreacion'),
  }
}

export function mapVenta(raw: Raw): Venta {
  return {
    id: Number(value(raw, 'Id', 'id') ?? 0),
    numeroFactura: String(value(raw, 'NumeroFactura', 'numeroFactura') ?? ''),
    ncf: value(raw, 'NCF', 'ncf') ?? null,
    fechaVenta: String(value(raw, 'FechaVenta', 'fechaVenta') ?? ''),
    idUsuario: Number(value(raw, 'IdUsuario', 'idUsuario') ?? 0),
    cliente: String(value(raw, 'Cliente', 'cliente') ?? ''),
    metodoPago: value(raw, 'MetodoPago', 'metodoPago') ?? 'Efectivo',
    subtotal: number(raw, 'Subtotal', 'subtotal'),
    descuentoPorcentaje: number(raw, 'DescuentoPorcentaje', 'descuentoPorcentaje'),
    descuentoMonto: number(raw, 'DescuentoMonto', 'descuentoMonto'),
    baseImponible: number(raw, 'BaseImponible', 'baseImponible'),
    itbis: number(raw, 'ITBIS', 'itbis'),
    total: number(raw, 'Total', 'total'),
    efectivoRecibido: optionalNumber(raw, 'EfectivoRecibido', 'efectivoRecibido'),
    cambio: optionalNumber(raw, 'Cambio', 'cambio'),
    activo: bool(raw, 'Activo', 'activo'),
    fechaCreacion: String(value(raw, 'FechaCreacion', 'fechaCreacion') ?? ''),
    cajero: value(raw, 'Cajero', 'cajero') ?? null,
    cajaCerrada: value(raw, 'CajaCerrada', 'cajaCerrada') ?? null,
    detalles: (value(raw, 'Detalles', 'detalles') ?? []).map((detalle: Raw) => ({
      id: Number(value(detalle, 'Id', 'id') ?? 0),
      idVenta: Number(value(detalle, 'IdVenta', 'idVenta') ?? 0),
      idProducto: Number(value(detalle, 'IdProducto', 'idProducto') ?? 0),
      sku: value(detalle, 'SKU', 'sku') ?? null,
      nombreProducto: value(detalle, 'NombreProducto', 'nombreProducto') ?? null,
      cantidad: number(detalle, 'Cantidad', 'cantidad'),
      precioUnitario: number(detalle, 'PrecioUnitario', 'precioUnitario'),
      importe: number(detalle, 'Importe', 'importe'),
    })),
  }
}

export function mapMovimientoCaja(raw: Raw): MovimientoCaja {
  return {
    id: Number(value(raw, 'Id', 'id') ?? 0),
    tipo: value(raw, 'Tipo', 'tipo') ?? 'Ingreso',
    concepto: String(value(raw, 'Concepto', 'concepto') ?? ''),
    metodoPago: value(raw, 'MetodoPago', 'metodoPago') ?? null,
    monto: number(raw, 'Monto', 'monto'),
    montoContado: optionalNumber(raw, 'MontoContado', 'montoContado'),
    diferencia: optionalNumber(raw, 'Diferencia', 'diferencia'),
    idUsuario: Number(value(raw, 'IdUsuario', 'idUsuario') ?? 0),
    idVenta: value(raw, 'IdVenta', 'idVenta') ?? null,
    fechaMovimiento: String(value(raw, 'FechaMovimiento', 'fechaMovimiento') ?? ''),
  }
}

export function mapResumenCaja(raw: Raw): ResumenCaja {
  return {
    fecha: String(value(raw, 'Fecha', 'fecha') ?? ''),
    estado: value(raw, 'Estado', 'estado') ?? 'Sin apertura',
    abierta: bool(raw, 'Abierta', 'abierta'),
    fechaApertura: value(raw, 'FechaApertura', 'fechaApertura') ?? null,
    fechaCierre: value(raw, 'FechaCierre', 'fechaCierre') ?? null,
    fondoInicial: number(raw, 'FondoInicial', 'fondoInicial'),
    ventasEfectivo: number(raw, 'VentasEfectivo', 'ventasEfectivo'),
    ventasNoEfectivo: number(raw, 'VentasNoEfectivo', 'ventasNoEfectivo'),
    ingresosExtra: number(raw, 'IngresosExtra', 'ingresosExtra'),
    egresosExtra: number(raw, 'EgresosExtra', 'egresosExtra'),
    efectivoEsperado: number(raw, 'EfectivoEsperado', 'efectivoEsperado'),
    montoContado: optionalNumber(raw, 'MontoContado', 'montoContado'),
    diferencia: optionalNumber(raw, 'Diferencia', 'diferencia'),
  }
}

export function mapEmpresa(raw: Raw): ConfiguracionEmpresa {
  return {
    id: Number(value(raw, 'Id', 'id') ?? 0),
    nombreComercial: String(value(raw, 'NombreComercial', 'nombreComercial') ?? ''),
    razonSocial: String(value(raw, 'RazonSocial', 'razonSocial') ?? ''),
    rnc: String(value(raw, 'RNC', 'rnc') ?? ''),
    direccion: value(raw, 'Direccion', 'direccion') ?? null,
    ciudad: value(raw, 'Ciudad', 'ciudad') ?? null,
    telefono: value(raw, 'Telefono', 'telefono') ?? null,
    email: value(raw, 'Email', 'email') ?? null,
    sitioWeb: value(raw, 'SitioWeb', 'sitioWeb') ?? null,
    redesSociales: value(raw, 'RedesSociales', 'redesSociales') ?? null,
    logoUrl: value(raw, 'LogoUrl', 'logoUrl') ?? null,
    ncfSerie: String(value(raw, 'NCFSerie', 'ncfSerie') ?? ''),
    ncfSecuenciaActual: number(raw, 'NCFSecuenciaActual', 'ncfSecuenciaActual'),
    itbisPorcentaje: number(raw, 'ITBISPorcentaje', 'itbisPorcentaje'),
    monedaSimbolo: String(value(raw, 'MonedaSimbolo', 'monedaSimbolo') ?? '$'),
  }
}

export function mapConfiguracionFactura(raw: Raw): ConfiguracionFactura {
  return {
    id: Number(value(raw, 'Id', 'id') ?? 0),
    tituloTicket: String(value(raw, 'TituloTicket', 'tituloTicket') ?? ''),
    mensajeAgradecimiento: String(value(raw, 'MensajeAgradecimiento', 'mensajeAgradecimiento') ?? ''),
    mensajeGarantia: String(value(raw, 'MensajeGarantia', 'mensajeGarantia') ?? ''),
    mensajePolitica: String(value(raw, 'MensajePolitica', 'mensajePolitica') ?? ''),
    mensajePie: value(raw, 'MensajePie', 'mensajePie') ?? null,
    redSocial: value(raw, 'RedSocial', 'redSocial') ?? null,
    prefijoFactura: String(value(raw, 'PrefijoFactura', 'prefijoFactura') ?? 'FAC'),
    anchoTicketMm: number(raw, 'AnchoTicketMm', 'anchoTicketMm'),
    mostrarLogo: bool(raw, 'MostrarLogo', 'mostrarLogo'),
    mostrarSKU: bool(raw, 'MostrarSKU', 'mostrarSKU'),
    mostrarCajero: bool(raw, 'MostrarCajero', 'mostrarCajero'),
    mostrarCliente: bool(raw, 'MostrarCliente', 'mostrarCliente'),
    mostrarNCF: bool(raw, 'MostrarNCF', 'mostrarNCF'),
    mostrarCodigoBarras: bool(raw, 'MostrarCodigoBarras', 'mostrarCodigoBarras'),
    activo: bool(raw, 'Activo', 'activo'),
  }
}

export function mapInvoice(raw: Raw): InvoiceData {
  const empresa = raw.empresa ?? {}
  const plantilla = raw.plantilla ?? {}
  const factura = raw.factura ?? {}
  const totales = raw.totales ?? {}
  return {
    empresa: {
      nombre: empresa.nombre ?? '',
      razonSocial: empresa.razon_social ?? empresa.razonSocial ?? '',
      rnc: empresa.rnc ?? '',
      direccion: empresa.direccion ?? null,
      ciudad: empresa.ciudad ?? null,
      telefono: empresa.telefono ?? null,
      email: empresa.email ?? null,
      sitioWeb: empresa.sitio_web ?? empresa.sitioWeb ?? null,
      redesSociales: empresa.redes_sociales ?? empresa.redesSociales ?? null,
      logoUrl: empresa.logo_url ?? empresa.logoUrl ?? null,
      moneda: empresa.moneda ?? '$',
      itbisPorcentaje: Number(empresa.itbis_porcentaje ?? empresa.itbisPorcentaje ?? 18),
    },
    plantilla: {
      titulo: plantilla.titulo ?? '',
      agradecimiento: plantilla.agradecimiento ?? '',
      garantia: plantilla.garantia ?? '',
      politica: plantilla.politica ?? '',
      pie: plantilla.pie ?? null,
      redSocial: plantilla.red_social ?? plantilla.redSocial ?? null,
      anchoTicketMm: Number(plantilla.ancho_ticket_mm ?? plantilla.anchoTicketMm ?? 80),
      mostrarLogo: Boolean(plantilla.mostrar_logo ?? plantilla.mostrarLogo ?? true),
      mostrarSKU: Boolean(plantilla.mostrar_sku ?? plantilla.mostrarSKU ?? true),
      mostrarCajero: Boolean(plantilla.mostrar_cajero ?? plantilla.mostrarCajero ?? true),
      mostrarCliente: Boolean(plantilla.mostrar_cliente ?? plantilla.mostrarCliente ?? true),
      mostrarNCF: Boolean(plantilla.mostrar_ncf ?? plantilla.mostrarNCF ?? true),
      mostrarCodigoBarras: Boolean(plantilla.mostrar_codigo_barras ?? plantilla.mostrarCodigoBarras ?? true),
    },
    factura: {
      numero: factura.numero ?? '',
      ncf: factura.ncf ?? null,
      fecha: factura.fecha ?? new Date().toISOString(),
      cajero: factura.cajero ?? '',
      cliente: factura.cliente ?? '',
      metodoPago: factura.metodo_pago ?? factura.metodoPago ?? '',
    },
    items: (raw.items ?? []).map((item: Raw) => ({
      cantidad: Number(item.cantidad ?? 0),
      sku: item.sku ?? null,
      nombre: item.nombre ?? '',
      precioUnitario: Number(item.precio_unitario ?? item.precioUnitario ?? 0),
      importe: Number(item.importe ?? 0),
    })),
    totales: {
      subtotal: Number(totales.subtotal ?? 0),
      descuento: Number(totales.descuento ?? 0),
      itbis: Number(totales.itbis ?? 0),
      total: Number(totales.total ?? 0),
      efectivoRecibido: optionalNumber(totales, 'efectivo_recibido', 'efectivoRecibido'),
      cambio: optionalNumber(totales, 'cambio'),
    },
  }
}

export function mapReporte(raw: Raw): ContabilidadReporte {
  const totales = raw.Totales ?? raw.totales ?? {}
  const inventario = raw.Inventario ?? raw.inventario ?? {}
  return {
    desde: raw.Desde ?? raw.desde ?? '',
    hasta: raw.Hasta ?? raw.hasta ?? '',
    totales: {
      ventasBrutas: Number(totales.VentasBrutas ?? totales.ventasBrutas ?? 0),
      subtotal: Number(totales.Subtotal ?? totales.subtotal ?? 0),
      descuentos: Number(totales.Descuentos ?? totales.descuentos ?? 0),
      itbis: Number(totales.ITBIS ?? totales.itbis ?? 0),
      costoMercancia: Number(totales.CostoMercancia ?? totales.costoMercancia ?? 0),
      gastosCaja: Number(totales.GastosCaja ?? totales.gastosCaja ?? 0),
      utilidadBruta: Number(totales.UtilidadBruta ?? totales.utilidadBruta ?? 0),
      utilidadNeta: Number(totales.UtilidadNeta ?? totales.utilidadNeta ?? 0),
      margenPorcentaje: Number(totales.MargenPorcentaje ?? totales.margenPorcentaje ?? 0),
      tickets: Number(totales.Tickets ?? totales.tickets ?? 0),
      ticketPromedio: Number(totales.TicketPromedio ?? totales.ticketPromedio ?? 0),
      unidadesVendidas: Number(totales.UnidadesVendidas ?? totales.unidadesVendidas ?? 0),
    },
    inventario: {
      unidades: Number(inventario.Unidades ?? inventario.unidades ?? 0),
      valorCosto: Number(inventario.ValorCosto ?? inventario.valorCosto ?? 0),
      valorVenta: Number(inventario.ValorVenta ?? inventario.valorVenta ?? 0),
      stockBajo: Number(inventario.StockBajo ?? inventario.stockBajo ?? 0),
    },
    serieDiaria: (raw.SerieDiaria ?? raw.serieDiaria ?? []).map((punto: Raw) => ({
      fecha: punto.Fecha ?? punto.fecha ?? '',
      ventas: Number(punto.Ventas ?? punto.ventas ?? 0),
      costo: Number(punto.Costo ?? punto.costo ?? 0),
      utilidad: Number(punto.Utilidad ?? punto.utilidad ?? 0),
    })),
    topProductos: (raw.TopProductos ?? raw.topProductos ?? []).map((producto: Raw) => ({
      nombre: producto.Nombre ?? producto.nombre ?? '',
      sku: producto.SKU ?? producto.sku ?? null,
      unidades: Number(producto.Unidades ?? producto.unidades ?? 0),
      ventas: Number(producto.Ventas ?? producto.ventas ?? 0),
      costo: Number(producto.Costo ?? producto.costo ?? 0),
      utilidad: Number(producto.Utilidad ?? producto.utilidad ?? 0),
    })),
    metodosPago: (raw.MetodosPago ?? raw.metodosPago ?? []).map((metodo: Raw) => ({
      metodo: metodo.Metodo ?? metodo.metodo ?? '',
      monto: Number(metodo.Monto ?? metodo.monto ?? 0),
      tickets: Number(metodo.Tickets ?? metodo.tickets ?? 0),
    })),
    ventasRecientes: (raw.VentasRecientes ?? raw.ventasRecientes ?? []).map(mapVenta),
  }
}
