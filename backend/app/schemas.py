"""Esquemas Pydantic para validación de requests/responses de la API.

Reflejan exactamente los campos del prototipo HTML:
- Producto: sku, nombre, descripcion, categoria, costo (admin), precio, stock, imagen
- Venta: numeroFactura, ncf, cliente, metodoPago, subtotal, descuento, itbis, total, efectivoRecibido, cambio
- Detalle: cantidad, precioUnitario, importe
- MovimientoCaja: tipo, concepto, monto
- Usuario: nombre, email, rol (RBAC)
"""

from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# --------------------------- Esquemas de Usuario / Auth ---------------------------

class UsuarioBase(BaseModel):
    Nombre: str
    Email: EmailStr
    Rol: str = "ROLE_CAJERO"
    Activo: bool = True


class UsuarioCreate(UsuarioBase):
    Password: str = Field(..., min_length=6)
    Permisos: Optional[List[str]] = None


class UsuarioUpdate(BaseModel):
    Nombre: Optional[str] = None
    Email: Optional[EmailStr] = None
    Rol: Optional[str] = None
    Activo: Optional[bool] = None
    Password: Optional[str] = None
    Permisos: Optional[List[str]] = None


class UsuarioOut(UsuarioBase):
    model_config = ConfigDict(from_attributes=True)

    Id: int
    Permisos: List[str] = Field(default_factory=list)
    FechaCreacion: Optional[datetime] = None


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    rol: str
    nombre: str
    email: str
    permisos: List[str] = Field(default_factory=list)


class TokenData(BaseModel):
    email: Optional[str] = None
    rol: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# --------------------------- Esquemas de Producto ---------------------------

class ProductoBase(BaseModel):
    SKU: str
    Nombre: str
    Descripcion: Optional[str] = None
    Categoria: str = "Damas"
    Costo: Optional[Decimal] = Field(default=None, description="Solo visible para ROLE_ADMIN")
    PorcentajeGanancia: Decimal = 0
    PrecioVenta: Decimal
    StockActual: int = 0
    StockMinimo: int = 4
    ImagenesUrls: Optional[str] = None
    Dicans: bool = False
    Mililitros: int = 0
    PrecioPorMl: Decimal = 0
    Activo: bool = True


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    Nombre: Optional[str] = None
    Descripcion: Optional[str] = None
    Categoria: Optional[str] = None
    Costo: Optional[Decimal] = None
    PorcentajeGanancia: Optional[Decimal] = None
    PrecioVenta: Optional[Decimal] = None
    StockActual: Optional[int] = None
    StockMinimo: Optional[int] = None
    ImagenesUrls: Optional[str] = None
    Dicans: Optional[bool] = None
    Mililitros: Optional[int] = None
    PrecioPorMl: Optional[Decimal] = None
    Activo: Optional[bool] = None


class ProductoOut(ProductoBase):
    model_config = ConfigDict(from_attributes=True)

    Id: int
    MililitrosDisponibles: int = 0
    FechaCreacion: Optional[datetime] = None
    FechaActualizacion: Optional[datetime] = None


# --------------------------- Esquemas de Venta ---------------------------

class DetalleVentaBase(BaseModel):
    IdProducto: int
    SKU: Optional[str] = None
    NombreProducto: Optional[str] = None
    Cantidad: int = Field(..., gt=0)
    PrecioUnitario: Decimal = Field(..., ge=0)
    EsDecant: bool = False


class DetalleVentaCreate(DetalleVentaBase):
    pass


class DetalleVentaOut(DetalleVentaBase):
    model_config = ConfigDict(from_attributes=True)

    Id: int
    IdVenta: int
    Importe: Decimal


class VentaBase(BaseModel):
    Cliente: str = "CONSUMIDOR FINAL"
    MetodoPago: str = "Efectivo"
    DescuentoPorcentaje: Decimal = Field(default=0, ge=0, le=100)
    EfectivoRecibido: Optional[Decimal] = None


class VentaCreate(VentaBase):
    Detalles: List[DetalleVentaCreate]


class VentaOut(VentaBase):
    model_config = ConfigDict(from_attributes=True)

    Id: int
    NumeroFactura: str
    NCF: Optional[str] = None
    FechaVenta: datetime
    IdUsuario: int
    Subtotal: Decimal
    DescuentoMonto: Decimal
    BaseImponible: Decimal
    ITBIS: Decimal
    Total: Decimal
    Cambio: Optional[Decimal] = None
    Activo: bool
    FechaCreacion: datetime
    Cajero: Optional[str] = None
    CajaCerrada: Optional[bool] = None
    Detalles: List[DetalleVentaOut] = Field(default_factory=list)


# --------------------------- Esquemas de Caja / Arqueo ---------------------------

class MovimientoCajaBase(BaseModel):
    Tipo: str  # Apertura, Ingreso, Egreso, Venta, Cierre
    Concepto: str
    MetodoPago: Optional[str] = None
    Monto: Decimal = Field(..., ge=0)


class MovimientoCajaCreate(MovimientoCajaBase):
    IdVenta: Optional[int] = None


class MovimientoCajaOut(MovimientoCajaBase):
    model_config = ConfigDict(from_attributes=True)

    Id: int
    IdUsuario: int
    IdVenta: Optional[int] = None
    MontoContado: Optional[Decimal] = None
    Diferencia: Optional[Decimal] = None
    FechaMovimiento: datetime


class ResumenCajaOut(BaseModel):
    Fecha: str
    Estado: str = "Cerrada"
    Abierta: bool = False
    FechaApertura: Optional[datetime] = None
    FechaCierre: Optional[datetime] = None
    FondoInicial: Decimal
    VentasEfectivo: Decimal
    VentasNoEfectivo: Decimal
    IngresosExtra: Decimal
    EgresosExtra: Decimal
    EfectivoEsperado: Decimal
    MontoContado: Optional[Decimal] = None
    Diferencia: Optional[Decimal] = None


class CierreCajaRequest(BaseModel):
    MontoContado: Optional[Decimal] = Field(default=None, ge=0)


class EditarVentaRequest(BaseModel):
    Cliente: Optional[str] = None
    MetodoPago: Optional[str] = None
    DescuentoPorcentaje: Optional[Decimal] = Field(default=None, ge=0, le=100)
    EfectivoRecibido: Optional[Decimal] = None
    Detalles: List[DetalleVentaCreate]


# --------------------------- Esquema de Configuración Empresa ---------------------------

class ConfiguracionEmpresaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    Id: int
    NombreComercial: str
    RazonSocial: str
    RNC: str
    Direccion: Optional[str]
    Ciudad: Optional[str]
    Telefono: Optional[str]
    Email: Optional[str]
    SitioWeb: Optional[str] = None
    RedesSociales: Optional[str] = None
    LogoUrl: Optional[str] = None
    NCFSerie: str
    NCFSecuenciaActual: int
    ITBISPorcentaje: Decimal
    MonedaSimbolo: str


class ConfiguracionEmpresaUpdate(BaseModel):
    NombreComercial: Optional[str] = None
    RazonSocial: Optional[str] = None
    RNC: Optional[str] = None
    Direccion: Optional[str] = None
    Ciudad: Optional[str] = None
    Telefono: Optional[str] = None
    Email: Optional[str] = None
    SitioWeb: Optional[str] = None
    RedesSociales: Optional[str] = None
    LogoUrl: Optional[str] = None
    NCFSerie: Optional[str] = None
    NCFSecuenciaActual: Optional[int] = Field(default=None, ge=0)
    ITBISPorcentaje: Optional[Decimal] = Field(default=None, ge=0, le=100)
    MonedaSimbolo: Optional[str] = None


class ConfiguracionFacturaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    Id: int
    TituloTicket: str
    MensajeAgradecimiento: str
    MensajeGarantia: str
    MensajePolitica: str
    MensajePie: Optional[str] = None
    RedSocial: Optional[str] = None
    PrefijoFactura: str
    AnchoTicketMm: int
    MostrarLogo: bool
    MostrarSKU: bool
    MostrarCajero: bool
    MostrarCliente: bool
    MostrarNCF: bool
    MostrarCodigoBarras: bool
    Activo: bool


class ConfiguracionFacturaUpdate(BaseModel):
    TituloTicket: Optional[str] = None
    MensajeAgradecimiento: Optional[str] = None
    MensajeGarantia: Optional[str] = None
    MensajePolitica: Optional[str] = None
    MensajePie: Optional[str] = None
    RedSocial: Optional[str] = None
    PrefijoFactura: Optional[str] = None
    AnchoTicketMm: Optional[int] = Field(default=None, ge=40, le=120)
    MostrarLogo: Optional[bool] = None
    MostrarSKU: Optional[bool] = None
    MostrarCajero: Optional[bool] = None
    MostrarCliente: Optional[bool] = None
    MostrarNCF: Optional[bool] = None
    MostrarCodigoBarras: Optional[bool] = None


# --------------------------- Esquemas de Contabilidad ---------------------------

class ContabilidadTotales(BaseModel):
    VentasBrutas: Decimal
    Subtotal: Decimal
    Descuentos: Decimal
    ITBIS: Decimal
    CostoMercancia: Decimal
    GastosCaja: Decimal
    UtilidadBruta: Decimal
    UtilidadNeta: Decimal
    MargenPorcentaje: Decimal
    Tickets: int
    TicketPromedio: Decimal
    UnidadesVendidas: int


class ContabilidadPuntoSerie(BaseModel):
    Fecha: str
    Ventas: Decimal
    Costo: Decimal
    Utilidad: Decimal


class ContabilidadProducto(BaseModel):
    Nombre: str
    SKU: Optional[str] = None
    Unidades: int
    Ventas: Decimal
    Costo: Decimal
    Utilidad: Decimal


class ContabilidadMetodoPago(BaseModel):
    Metodo: str
    Monto: Decimal
    Tickets: int


class ContabilidadInventario(BaseModel):
    Unidades: int
    ValorCosto: Decimal
    ValorVenta: Decimal
    StockBajo: int


class ContabilidadReporteOut(BaseModel):
    Desde: str
    Hasta: str
    Totales: ContabilidadTotales
    Inventario: ContabilidadInventario
    SerieDiaria: List[ContabilidadPuntoSerie]
    TopProductos: List[ContabilidadProducto]
    MetodosPago: List[ContabilidadMetodoPago]
    VentasRecientes: List[VentaOut]
