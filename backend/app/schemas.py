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


class UsuarioUpdate(BaseModel):
    Nombre: Optional[str] = None
    Email: Optional[EmailStr] = None
    Rol: Optional[str] = None
    Activo: Optional[bool] = None
    Password: Optional[str] = None


class UsuarioOut(UsuarioBase):
    model_config = ConfigDict(from_attributes=True)

    Id: int
    FechaCreacion: Optional[datetime] = None


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    rol: str
    nombre: str
    email: str


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
    PrecioVenta: Decimal
    StockActual: int = 0
    StockMinimo: int = 4
    ImagenUrl: Optional[str] = None
    Activo: bool = True


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    Nombre: Optional[str] = None
    Descripcion: Optional[str] = None
    Categoria: Optional[str] = None
    Costo: Optional[Decimal] = None
    PrecioVenta: Optional[Decimal] = None
    StockActual: Optional[int] = None
    StockMinimo: Optional[int] = None
    ImagenUrl: Optional[str] = None
    Activo: Optional[bool] = None


class ProductoOut(ProductoBase):
    model_config = ConfigDict(from_attributes=True)

    Id: int
    FechaCreacion: Optional[datetime] = None
    FechaActualizacion: Optional[datetime] = None


# --------------------------- Esquemas de Venta ---------------------------

class DetalleVentaBase(BaseModel):
    IdProducto: int
    SKU: Optional[str] = None
    NombreProducto: Optional[str] = None
    Cantidad: int = Field(..., gt=0)
    PrecioUnitario: Decimal = Field(..., ge=0)


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
    FechaMovimiento: datetime


class ResumenCajaOut(BaseModel):
    Fecha: str
    FondoInicial: Decimal
    VentasEfectivo: Decimal
    VentasNoEfectivo: Decimal
    IngresosExtra: Decimal
    EgresosExtra: Decimal
    EfectivoEsperado: Decimal


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
    NCFSerie: str
    NCFSecuenciaActual: int
    ITBISPorcentaje: Decimal
    MonedaSimbolo: str
