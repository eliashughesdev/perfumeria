import axios from 'axios'
import type {
  CatalogoPermisos,
  ConfiguracionEmpresa,
  ConfiguracionFactura,
  ContabilidadReporte,
  InvoiceData,
  LoginRequest,
  MovimientoCaja,
  MovimientoCajaCreate,
  Producto,
  ResumenCaja,
  TokenData,
  Usuario,
  UsuarioCreate,
  UsuarioUpdate,
  Venta,
  VentaCreate,
  VentaUpdate,
} from '@/types'

const API_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lessence_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authService = {
  login: (data: LoginRequest) => api.post<TokenData>('/api/auth/login', data),
  refresh: (refreshToken: string) => api.post<TokenData>('/api/auth/refresh', null, { params: { refresh_token: refreshToken } }),
  me: () => api.get<Usuario>('/api/auth/me'),
}

export const productService = {
  list: (params?: { categoria?: string; activo?: boolean; buscar?: string }) => api.get<Producto[]>('/api/products', { params }),
  get: (id: number) => api.get<Producto>(`/api/products/${id}`),
  create: (data: Partial<Producto>) => api.post<Producto>('/api/products', data),
  update: (id: number, data: Partial<Producto>) => api.put<Producto>(`/api/products/${id}`, data),
  remove: (id: number) => api.delete(`/api/products/${id}`),
}

export const saleService = {
  create: (data: VentaCreate) => api.post<Venta>('/api/sales', data),
  list: (params?: { limite?: number; desde?: string; hasta?: string; buscar?: string; metodo_pago?: string }) =>
    api.get<Venta[]>('/api/sales', { params }),
  get: (id: number) => api.get<Venta>(`/api/sales/${id}`),
  update: (id: number, data: VentaUpdate) => api.put<Venta>(`/api/sales/${id}`, data),
  invoice: (id: number) => api.get<InvoiceData>(`/api/sales/${id}/invoice`),
}

export const cajaService = {
  apertura: (monto: number) => api.post<MovimientoCaja>('/api/caja/apertura', null, { params: { monto } }),
  movimiento: (data: MovimientoCajaCreate) => api.post<MovimientoCaja>('/api/caja/movimiento', data),
  resumen: (fecha?: string) => api.get<ResumenCaja>('/api/caja/resumen', { params: { fecha } }),
  movimientos: (params?: { limite?: number }) => api.get<MovimientoCaja[]>('/api/caja/movimientos', { params }),
  cierre: (montoContado?: number) => api.post('/api/caja/cierre', montoContado === undefined ? undefined : { MontoContado: montoContado }),
}

export const userService = {
  list: () => api.get<Usuario[]>('/api/users'),
  get: (id: number) => api.get<Usuario>(`/api/users/${id}`),
  create: (data: UsuarioCreate) => api.post<Usuario>('/api/users', data),
  update: (id: number, data: UsuarioUpdate) => api.put<Usuario>(`/api/users/${id}`, data),
  remove: (id: number) => api.delete(`/api/users/${id}`),
  permissions: () => api.get<CatalogoPermisos>('/api/users/permissions'),
}

export const configService = {
  get: () => api.get<ConfiguracionEmpresa>('/api/configuracion'),
  update: (data: Partial<ConfiguracionEmpresa>) => api.put<ConfiguracionEmpresa>('/api/configuracion', data),
  getFactura: () => api.get<ConfiguracionFactura>('/api/configuracion/factura'),
  updateFactura: (data: Partial<ConfiguracionFactura>) => api.put<ConfiguracionFactura>('/api/configuracion/factura', data),
}

export const accountingService = {
  report: (params?: { desde?: string; hasta?: string }) => api.get<ContabilidadReporte>('/api/accounting/reporte', { params }),
  downloadCsv: (params?: { desde?: string; hasta?: string }) =>
    api.get<Blob>('/api/accounting/reporte.csv', { params, responseType: 'blob' }),
}

export default api
