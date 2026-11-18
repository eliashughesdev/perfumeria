export type RolUsuario = 'ROLE_ADMIN' | 'ROLE_CAJERO'

export type PermisoClave =
  | 'pos.vender'
  | 'pos.descuentos'
  | 'inventario.ver'
  | 'inventario.costos'
  | 'inventario.editar'
  | 'caja.movimientos'
  | 'caja.apertura_cierre'
  | 'contabilidad.ver'
  | 'factura.editar'
  | 'factura.configurar'
  | 'usuarios.gestionar'

export interface PermisoDefinicion {
  clave: PermisoClave
  etiqueta: string
  grupo: string
}

export interface CatalogoPermisos {
  roles: RolUsuario[]
  permisos: PermisoDefinicion[]
  por_rol: Record<RolUsuario, PermisoClave[]>
}

export interface Usuario {
  id: number
  nombre: string
  email: string
  rol: RolUsuario
  activo: boolean
  permisos: PermisoClave[]
  fechaCreacion?: string
}

export interface TokenData {
  access_token: string
  refresh_token: string
  token_type: string
  rol: RolUsuario
  nombre: string
  email: string
  permisos: PermisoClave[]
}

export interface Producto {
  id: number
  sku: string
  nombre: string
  descripcion?: string | null
  categoria: string
  costo?: number | null
  porcentajeGanancia?: number | null
  precioVenta: number
  stockActual: number
  stockMinimo: number
  imagenesUrls?: string | null  // JSON array of image URLs
  di_cans?: boolean | null  // field for detailed sales (5ml increments)
  mililitros?: number | null
  mililitrosDisponibles?: number | null
  precioPorMl?: number | null
  activo: boolean
  fechaCreacion?: string
  fechaActualizacion?: string
}

export interface DetalleVenta {
  id?: number
  idVenta?: number
  idProducto: number
  sku?: string | null
  nombreProducto?: string | null
  cantidad: number
  precioUnitario: number
  importe: number
  esDecant?: boolean
}

export interface Venta {
  id: number
  numeroFactura: string
  ncf?: string | null
  fechaVenta: string
  idUsuario: number
  cliente: string
  metodoPago: 'Efectivo' | 'Tarjeta' | 'Transferencia'
  subtotal: number
  descuentoPorcentaje: number
  descuentoMonto: number
  baseImponible: number
  itbis: number
  total: number
  efectivoRecibido?: number | null
  cambio?: number | null
  activo: boolean
  fechaCreacion: string
  cajero?: string | null
  cajaCerrada?: boolean | null
  detalles?: DetalleVenta[]
}

export interface VentaCreate {
  cliente?: string
  metodoPago: 'Efectivo' | 'Tarjeta' | 'Transferencia'
  descuentoPorcentaje?: number
  efectivoRecibido?: number
  detalles: DetalleVenta[]
}

export interface MovimientoCaja {
  id: number
  tipo: 'Apertura' | 'Ingreso' | 'Egreso' | 'Venta' | 'Cierre'
  concepto: string
  metodoPago?: string | null
  monto: number
  montoContado?: number | null
  diferencia?: number | null
  idUsuario: number
  idVenta?: number | null
  fechaMovimiento: string
}

export interface MovimientoCajaCreate {
  tipo: 'Ingreso' | 'Egreso'
  concepto: string
  metodoPago?: string
  monto: number
  idVenta?: number
}

export interface ResumenCaja {
  fecha: string
  estado: 'Abierta' | 'Cerrada' | 'Sin apertura'
  abierta: boolean
  fechaApertura?: string | null
  fechaCierre?: string | null
  fondoInicial: number
  ventasEfectivo: number
  ventasNoEfectivo: number
  ingresosExtra: number
  egresosExtra: number
  efectivoEsperado: number
  montoContado?: number | null
  diferencia?: number | null
}

export interface ConfiguracionEmpresa {
  id: number
  nombreComercial: string
  razonSocial: string
  rnc: string
  direccion?: string | null
  ciudad?: string | null
  telefono?: string | null
  email?: string | null
  sitioWeb?: string | null
  redesSociales?: string | null
  logoUrl?: string | null
  ncfSerie: string
  ncfSecuenciaActual: number
  itbisPorcentaje: number
  monedaSimbolo: string
}

export interface ConfiguracionFactura {
  id: number
  tituloTicket: string
  mensajeAgradecimiento: string
  mensajeGarantia: string
  mensajePolitica: string
  mensajePie?: string | null
  redSocial?: string | null
  prefijoFactura: string
  anchoTicketMm: number
  mostrarLogo: boolean
  mostrarSKU: boolean
  mostrarCajero: boolean
  mostrarCliente: boolean
  mostrarNCF: boolean
  mostrarCodigoBarras: boolean
  activo: boolean
}

export interface InvoiceData {
  empresa: {
    nombre: string
    razonSocial: string
    rnc: string
    direccion?: string | null
    ciudad?: string | null
    telefono?: string | null
    email?: string | null
    sitioWeb?: string | null
    redesSociales?: string | null
    logoUrl?: string | null
    moneda: string
    itbisPorcentaje: number
  }
  plantilla: {
    titulo: string
    agradecimiento: string
    garantia: string
    politica: string
    pie?: string | null
    redSocial?: string | null
    anchoTicketMm: number
    mostrarLogo: boolean
    mostrarSKU: boolean
    mostrarCajero: boolean
    mostrarCliente: boolean
    mostrarNCF: boolean
    mostrarCodigoBarras: boolean
  }
  factura: {
    numero: string
    ncf?: string | null
    fecha: string
    cajero: string
    cliente: string
    metodoPago: string
  }
  items: Array<{
    cantidad: number
    sku?: string | null
    nombre: string
    precioUnitario: number
    importe: number
    esDecant?: boolean
  }>
  totales: {
    subtotal: number
    descuento: number
    itbis: number
    total: number
    efectivoRecibido?: number | null
    cambio?: number | null
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UsuarioCreate {
  nombre: string
  email: string
  rol: RolUsuario
  activo?: boolean
  password: string
  permisos?: PermisoClave[]
}

export interface UsuarioUpdate {
  nombre?: string
  email?: string
  rol?: RolUsuario
  activo?: boolean
  password?: string
  permisos?: PermisoClave[]
}

export interface ContabilidadTotales {
  ventasBrutas: number
  subtotal: number
  descuentos: number
  itbis: number
  costoMercancia: number
  gastosCaja: number
  utilidadBruta: number
  utilidadNeta: number
  margenPorcentaje: number
  tickets: number
  ticketPromedio: number
  unidadesVendidas: number
}

export interface ContabilidadPuntoSerie {
  fecha: string
  ventas: number
  costo: number
  utilidad: number
}

export interface ContabilidadProducto {
  nombre: string
  sku?: string | null
  unidades: number
  ventas: number
  costo: number
  utilidad: number
}

export interface ContabilidadMetodoPago {
  metodo: string
  monto: number
  tickets: number
}

export interface ContabilidadReporte {
  desde: string
  hasta: string
  totales: ContabilidadTotales
  inventario: {
    unidades: number
    valorCosto: number
    valorVenta: number
    stockBajo: number
  }
  serieDiaria: ContabilidadPuntoSerie[]
  topProductos: ContabilidadProducto[]
  metodosPago: ContabilidadMetodoPago[]
  ventasRecientes: Venta[]
}

export interface VentaUpdate {
  cliente?: string
  metodoPago?: 'Efectivo' | 'Tarjeta' | 'Transferencia'
  descuentoPorcentaje?: number
  efectivoRecibido?: number
  detalles: DetalleVenta[]
}
