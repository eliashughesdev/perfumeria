export type RolUsuario = 'ROLE_ADMIN' | 'ROLE_CAJERO'

export interface Usuario {
  id: number
  nombre: string
  email: string
  rol: RolUsuario
  activo: boolean
  fechaCreacion?: string
}

export interface TokenData {
  access_token: string
  refresh_token: string
  token_type: string
  rol: RolUsuario
  nombre: string
  email: string
}

export interface Producto {
  id: number
  sku: string
  nombre: string
  descripcion?: string | null
  categoria: string
  costo?: number | null
  precioVenta: number
  stockActual: number
  stockMinimo: number
  imagenUrl?: string | null
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
  fondoInicial: number
  ventasEfectivo: number
  ventasNoEfectivo: number
  ingresosExtra: number
  egresosExtra: number
  efectivoEsperado: number
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
  ncfSerie: string
  ncfSecuenciaActual: number
  itbisPorcentaje: number
  monedaSimbolo: string
}

export interface InvoiceData {
  empresa: {
    nombre: string
    razonSocial: string
    rnc: string
    direccion?: string | null
    ciudad?: string | null
    telefono?: string | null
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
}

export interface UsuarioUpdate {
  nombre?: string
  email?: string
  rol?: RolUsuario
  activo?: boolean
  password?: string
}
