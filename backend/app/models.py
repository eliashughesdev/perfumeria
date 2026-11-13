"""Modelos ORM SQLAlchemy mapeados a las tablas de SQL Server.

Tablas: Usuarios, ConfiguracionEmpresa, Productos, Ventas, DetalleVentas, MovimientosCaja
"""

from sqlalchemy import Column, Integer, String, Numeric, DateTime, Boolean, ForeignKey, Text, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Usuario(Base):
    __tablename__ = "Usuarios"

    Id = Column(Integer, primary_key=True, index=True)
    Nombre = Column(String(150), nullable=False)
    Email = Column(String(255), unique=True, nullable=False, index=True)
    PasswordHash = Column(String(500), nullable=False)
    Rol = Column(String(50), nullable=False, default="ROLE_CAJERO", index=True)
    Activo = Column(Boolean, default=True, nullable=False)
    FechaCreacion = Column(DateTime, server_default=func.getdate())
    FechaActualizacion = Column(DateTime, nullable=True)

    __table_args__ = (
        CheckConstraint("Rol IN ('ROLE_ADMIN', 'ROLE_CAJERO')", name="CHK_Usuarios_Rol"),
    )

    ventas = relationship("Venta", back_populates="usuario")
    movimientos_caja = relationship("MovimientoCaja", back_populates="usuario")


class ConfiguracionEmpresa(Base):
    __tablename__ = "ConfiguracionEmpresa"

    Id = Column(Integer, primary_key=True, index=True)
    NombreComercial = Column(String(200), nullable=False, default="L'ESSENCE PERFUMERÍA")
    RazonSocial = Column(String(200), nullable=False, default="INVERSIONES AROMAS DEL CARIBE SRL")
    RNC = Column(String(50), nullable=False, default="1-31-84920-5")
    Direccion = Column(String(500), nullable=True)
    Ciudad = Column(String(100), nullable=True)
    Telefono = Column(String(50), nullable=True)
    Email = Column(String(255), nullable=True)
    SitioWeb = Column(String(255), nullable=True)
    RedesSociales = Column(String(500), nullable=True)
    NCFSerie = Column(String(20), nullable=False, default="B02")
    NCFSecuenciaActual = Column(Integer, nullable=False, default=0)
    ITBISPorcentaje = Column(Numeric(5, 2), nullable=False, default=18.00)
    MonedaSimbolo = Column(String(10), nullable=False, default="$")
    Activo = Column(Boolean, default=True, nullable=False)
    FechaCreacion = Column(DateTime, server_default=func.getdate())
    FechaActualizacion = Column(DateTime, nullable=True)


class Producto(Base):
    __tablename__ = "Productos"

    Id = Column(Integer, primary_key=True, index=True)
    SKU = Column(String(50), unique=True, nullable=False, index=True)
    Nombre = Column(String(200), nullable=False)
    Descripcion = Column(Text, nullable=True)
    Categoria = Column(String(50), nullable=False, default="Damas", index=True)
    Costo = Column(Numeric(18, 2), nullable=False, default=0.00)
    PrecioVenta = Column(Numeric(18, 2), nullable=False, default=0.00)
    StockActual = Column(Integer, nullable=False, default=0)
    StockMinimo = Column(Integer, nullable=False, default=4)
    ImagenUrl = Column(String(1000), nullable=True)
    Activo = Column(Boolean, default=True, nullable=False, index=True)
    FechaCreacion = Column(DateTime, server_default=func.getdate())
    FechaActualizacion = Column(DateTime, nullable=True)

    __table_args__ = (
        CheckConstraint("StockActual >= 0", name="CHK_Productos_Stock"),
        CheckConstraint("PrecioVenta >= 0 AND Costo >= 0", name="CHK_Productos_Precios"),
    )

    detalles_venta = relationship("DetalleVenta", back_populates="producto")


class Venta(Base):
    __tablename__ = "Ventas"

    Id = Column(Integer, primary_key=True, index=True)
    NumeroFactura = Column(String(50), unique=True, nullable=False, index=True)
    NCF = Column(String(50), nullable=True)
    FechaVenta = Column(DateTime, nullable=False, server_default=func.getdate(), index=True)
    IdUsuario = Column(Integer, ForeignKey("Usuarios.Id"), nullable=False, index=True)
    Cliente = Column(String(200), nullable=False, default="CONSUMIDOR FINAL")
    MetodoPago = Column(String(50), nullable=False, default="Efectivo", index=True)
    Subtotal = Column(Numeric(18, 2), nullable=False, default=0.00)
    DescuentoPorcentaje = Column(Numeric(5, 2), nullable=False, default=0.00)
    DescuentoMonto = Column(Numeric(18, 2), nullable=False, default=0.00)
    BaseImponible = Column(Numeric(18, 2), nullable=False, default=0.00)
    ITBIS = Column(Numeric(18, 2), nullable=False, default=0.00)
    Total = Column(Numeric(18, 2), nullable=False, default=0.00)
    EfectivoRecibido = Column(Numeric(18, 2), nullable=True)
    Cambio = Column(Numeric(18, 2), nullable=True)
    Activo = Column(Boolean, default=True, nullable=False)
    FechaCreacion = Column(DateTime, server_default=func.getdate())

    __table_args__ = (
        CheckConstraint("MetodoPago IN ('Efectivo', 'Tarjeta', 'Transferencia')", name="CHK_Ventas_MetodoPago"),
        CheckConstraint("Total >= 0", name="CHK_Ventas_Totales"),
    )

    usuario = relationship("Usuario", back_populates="ventas")
    detalles = relationship("DetalleVenta", back_populates="venta", cascade="all, delete-orphan")
    movimientos_caja = relationship("MovimientoCaja", back_populates="venta")


class DetalleVenta(Base):
    __tablename__ = "DetalleVentas"

    Id = Column(Integer, primary_key=True, index=True)
    IdVenta = Column(Integer, ForeignKey("Ventas.Id", ondelete="CASCADE"), nullable=False, index=True)
    IdProducto = Column(Integer, ForeignKey("Productos.Id"), nullable=False, index=True)
    SKU = Column(String(50), nullable=True)
    NombreProducto = Column(String(200), nullable=True)
    Cantidad = Column(Integer, nullable=False, default=1)
    PrecioUnitario = Column(Numeric(18, 2), nullable=False, default=0.00)
    Importe = Column(Numeric(18, 2), nullable=False, default=0.00)

    __table_args__ = (
        CheckConstraint("Cantidad > 0", name="CHK_DetalleVentas_Cantidad"),
        CheckConstraint("Importe >= 0", name="CHK_DetalleVentas_Importe"),
    )

    venta = relationship("Venta", back_populates="detalles")
    producto = relationship("Producto", back_populates="detalles_venta")


class MovimientoCaja(Base):
    __tablename__ = "MovimientosCaja"

    Id = Column(Integer, primary_key=True, index=True)
    Tipo = Column(String(50), nullable=False, index=True)  # Apertura, Ingreso, Egreso, Venta, Cierre
    Concepto = Column(String(500), nullable=False)
    MetodoPago = Column(String(50), nullable=True)
    Monto = Column(Numeric(18, 2), nullable=False, default=0.00)
    IdUsuario = Column(Integer, ForeignKey("Usuarios.Id"), nullable=False, index=True)
    IdVenta = Column(Integer, ForeignKey("Ventas.Id"), nullable=True)
    FechaMovimiento = Column(DateTime, nullable=False, server_default=func.getdate(), index=True)

    __table_args__ = (
        CheckConstraint("Tipo IN ('Apertura', 'Ingreso', 'Egreso', 'Venta', 'Cierre')", name="CHK_MovimientosCaja_Tipo"),
    )

    usuario = relationship("Usuario", back_populates="movimientos_caja")
    venta = relationship("Venta", back_populates="movimientos_caja")
