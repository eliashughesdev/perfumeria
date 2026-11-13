"""Router de Ventas (Punto de Venta).

Endpoints RBAC:
  POST   /api/sales                 - Registrar una venta y descontar stock (Cajero/Admin)
  GET    /api/sales                 - Listar ventas (Cajero/Admin)
  GET    /api/sales/{id}            - Detalle de venta con líneas (Cajero/Admin)
  GET    /api/sales/{id}/invoice    - Datos para ticket térmico (Cajero/Admin)

Lógica de negocio:
  - Calcula subtotal, descuento, base imponible, ITBIS (18%), total.
  - Valida stock suficiente antes de descontar.
  - Genera número de factura y NCF secuencial.
  - Registra movimiento de caja si el pago es Efectivo.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from decimal import Decimal
from datetime import datetime
from app.database import get_db
from app.models import Venta, DetalleVenta, Producto, Usuario, MovimientoCaja, ConfiguracionEmpresa
from app.schemas import VentaCreate, VentaOut, DetalleVentaOut
from app.dependencies import get_current_user, require_cajero_or_admin

router = APIRouter(tags=["Ventas"])


def _generar_numero_factura(db: Session, serie: str) -> str:
    ultima = (
        db.query(Venta)
        .filter(Venta.NumeroFactura.like(f"FAC-{serie}-%"))
        .order_by(Venta.Id.desc())
        .first()
    )
    if ultima and ultima.NumeroFactura:
        try:
            num = int(ultima.NumeroFactura.split("-")[-1]) + 1
        except (ValueError, IndexError):
            num = 1
    else:
        num = 1
    return f"FAC-{serie}-{num:06d}"


def _calcular_totales(detalles: List[dict], descuento_pct: Decimal, itbis_pct: Decimal):
    subtotal = sum((d["PrecioUnitario"] * d["Cantidad"] for d in detalles), Decimal("0"))
    descuento_monto = subtotal * (descuento_pct / Decimal("100"))
    base_imponible = subtotal - descuento_monto
    itbis = base_imponible * (itbis_pct / Decimal("100"))
    total = base_imponible + itbis
    return subtotal, descuento_monto, base_imponible, itbis, total


@router.post("", response_model=VentaOut, status_code=status.HTTP_201_CREATED, summary="Registrar venta")
def registrar_venta(
    venta_in: VentaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_cajero_or_admin),
):
    cfg = db.query(ConfiguracionEmpresa).filter(ConfiguracionEmpresa.Activo == True).first()
    itbis_pct = cfg.ITBISPorcentaje if cfg else Decimal("18.00")

    # Validar stock de todos los productos antes de descontar
    for det in venta_in.Detalles:
        producto = db.query(Producto).filter(Producto.Id == det.IdProducto, Producto.Activo == True).first()
        if not producto:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto {det.IdProducto} no encontrado")
        if producto.StockActual < det.Cantidad:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuficiente para {producto.Nombre}. Disponible: {producto.StockActual}",
            )

    subtotal, descuento_monto, base_imponible, itbis, total = _calcular_totales(
        [d.model_dump() for d in venta_in.Detalles],
        venta_in.DescuentoPorcentaje,
        itbis_pct,
    )

    cambio = None
    if venta_in.EfectivoRecibido is not None:
        cambio = max(Decimal("0"), venta_in.EfectivoRecibido - total)

    numero_factura = _generar_numero_factura(db, cfg.NCFSerie if cfg else "B02")

    venta = Venta(
        NumeroFactura=numero_factura,
        NCF=f"{cfg.NCFSerie}{numero_factura.split('-')[-1]}" if cfg else None,
        IdUsuario=current_user.Id,
        Cliente=venta_in.Cliente,
        MetodoPago=venta_in.MetodoPago,
        Subtotal=subtotal,
        DescuentoPorcentaje=venta_in.DescuentoPorcentaje,
        DescuentoMonto=descuento_monto,
        BaseImponible=base_imponible,
        ITBIS=itbis,
        Total=total,
        EfectivoRecibido=venta_in.EfectivoRecibido,
        Cambio=cambio,
    )
    db.add(venta)
    db.flush()

    for det in venta_in.Detalles:
        producto = db.query(Producto).filter(Producto.Id == det.IdProducto).first()
        db.add(
            DetalleVenta(
                IdVenta=venta.Id,
                IdProducto=det.IdProducto,
                SKU=producto.SKU,
                NombreProducto=producto.Nombre,
                Cantidad=det.Cantidad,
                PrecioUnitario=det.PrecioUnitario,
                Importe=det.PrecioUnitario * det.Cantidad,
            )
        )
        producto.StockActual -= det.Cantidad

    # Movimiento de caja solo si es Efectivo
    if venta_in.MetodoPago == "Efectivo":
        db.add(
            MovimientoCaja(
                Tipo="Venta",
                Concepto=f"Venta Ticket {numero_factura}",
                MetodoPago="Efectivo",
                Monto=total,
                IdUsuario=current_user.Id,
                IdVenta=venta.Id,
            )
        )

    db.commit()
    db.refresh(venta)
    return _venta_a_out(db, venta, current_user.Rol)


@router.get("", response_model=List[VentaOut], summary="Listar ventas")
def listar_ventas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_cajero_or_admin),
    limite: int = 50,
):
    ventas = (
        db.query(Venta)
        .options(joinedload(Venta.detalles))
        .filter(Venta.Activo == True)
        .order_by(Venta.FechaVenta.desc())
        .limit(limite)
        .all()
    )
    return [_venta_a_out(db, v, current_user.Rol) for v in ventas]


@router.get("/{venta_id}", response_model=VentaOut, summary="Detalle de venta")
def obtener_venta(
    venta_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_cajero_or_admin),
):
    venta = db.query(Venta).options(joinedload(Venta.detalles)).filter(Venta.Id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")
    return _venta_a_out(db, venta, current_user.Rol)


@router.get("/{venta_id}/invoice", summary="Datos para ticket térmico (80mm)")
def ticket_factura(
    venta_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_cajero_or_admin),
):
    venta = db.query(Venta).options(joinedload(Venta.detalles)).filter(Venta.Id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")
    cfg = db.query(ConfiguracionEmpresa).filter(ConfiguracionEmpresa.Activo == True).first()
    return {
        "empresa": {
            "nombre": cfg.NombreComercial if cfg else "L'ESSENCE PERFUMERÍA",
            "razon_social": cfg.RazonSocial if cfg else "",
            "rnc": cfg.RNC if cfg else "",
            "direccion": cfg.Direccion if cfg else "",
            "ciudad": cfg.Ciudad if cfg else "",
            "telefono": cfg.Telefono if cfg else "",
        },
        "factura": {
            "numero": venta.NumeroFactura,
            "ncf": venta.NCF,
            "fecha": venta.FechaVenta.isoformat(),
            "cajero": current_user.Nombre,
            "cliente": venta.Cliente,
            "metodo_pago": venta.MetodoPago,
        },
        "items": [
            {
                "cantidad": d.Cantidad,
                "sku": d.SKU,
                "nombre": d.NombreProducto,
                "precio_unitario": float(d.PrecioUnitario),
                "importe": float(d.Importe),
            }
            for d in venta.detalles
        ],
        "totales": {
            "subtotal": float(venta.Subtotal),
            "descuento": float(venta.DescuentoMonto),
            "itbis": float(venta.ITBIS),
            "total": float(venta.Total),
            "efectivo_recibido": float(venta.EfectivoRecibido) if venta.EfectivoRecibido else None,
            "cambio": float(venta.Cambio) if venta.Cambio else None,
        },
    }


def _venta_a_out(db: Session, venta: Venta, rol: str) -> VentaOut:
    detalles = [
        DetalleVentaOut(
            Id=d.Id,
            IdVenta=d.IdVenta,
            IdProducto=d.IdProducto,
            SKU=d.SKU,
            NombreProducto=d.NombreProducto,
            Cantidad=d.Cantidad,
            PrecioUnitario=d.PrecioUnitario,
            Importe=d.Importe,
        )
        for d in venta.detalles
    ]
    return VentaOut(
        Id=venta.Id,
        NumeroFactura=venta.NumeroFactura,
        NCF=venta.NCF,
        FechaVenta=venta.FechaVenta,
        IdUsuario=venta.IdUsuario,
        Cliente=venta.Cliente,
        MetodoPago=venta.MetodoPago,
        Subtotal=venta.Subtotal,
        DescuentoPorcentaje=venta.DescuentoPorcentaje,
        DescuentoMonto=venta.DescuentoMonto,
        BaseImponible=venta.BaseImponible,
        ITBIS=venta.ITBIS,
        Total=venta.Total,
        EfectivoRecibido=venta.EfectivoRecibido,
        Cambio=venta.Cambio,
        Activo=venta.Activo,
        FechaCreacion=venta.FechaCreacion,
        Detalles=detalles,
    )
