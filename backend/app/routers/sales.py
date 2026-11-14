"""Router de ventas y facturación."""

from datetime import date, datetime, time
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import require_cajero_or_admin, require_permission
from app.models import MovimientoCaja, Usuario, Venta
from app.permissions import has_permission
from app.schemas import EditarVentaRequest, VentaCreate, VentaOut
from app.services.cash_service import get_open_shift
from app.services.invoice_service import build_invoice_payload
from app.services.sales_service import crear_venta, editar_venta, venta_a_out

router = APIRouter(tags=["Ventas"])


def _ultimo_cierre(db: Session):
    return (
        db.query(func.max(MovimientoCaja.FechaMovimiento))
        .filter(MovimientoCaja.Tipo == "Cierre")
        .scalar()
    )


def _caja_cerrada(ultimo_cierre, fecha_venta: datetime) -> bool:
    return bool(ultimo_cierre and fecha_venta <= ultimo_cierre)


@router.post("", response_model=VentaOut, status_code=status.HTTP_201_CREATED, summary="Registrar venta")
def registrar_venta(
    venta_in: VentaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("pos.vender")),
):
    if not get_open_shift(db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La caja está cerrada. Solicite al administrador abrir el turno.",
        )
    if venta_in.DescuentoPorcentaje > 0 and not has_permission(current_user, "pos.descuentos"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permiso para aplicar descuentos.",
        )
    return crear_venta(db, venta_in, current_user)


@router.get("", response_model=List[VentaOut], summary="Listar ventas")
def listar_ventas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_cajero_or_admin),
    limite: int = Query(100, ge=1, le=500),
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    buscar: Optional[str] = None,
    metodo_pago: Optional[str] = None,
):
    query = (
        db.query(Venta)
        .options(joinedload(Venta.detalles), joinedload(Venta.usuario))
        .filter(Venta.Activo == True)
    )
    if desde:
        query = query.filter(Venta.FechaVenta >= datetime.combine(desde, time.min))
    if hasta:
        query = query.filter(Venta.FechaVenta <= datetime.combine(hasta, time.max))
    if metodo_pago:
        query = query.filter(Venta.MetodoPago == metodo_pago)
    if buscar and buscar.strip():
        term = f"%{buscar.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Venta.NumeroFactura).like(term),
                func.lower(Venta.NCF).like(term),
                func.lower(Venta.Cliente).like(term),
            )
        )
    ventas = query.order_by(Venta.FechaVenta.desc()).limit(limite).all()
    ultimo_cierre = _ultimo_cierre(db)
    return [venta_a_out(venta, _caja_cerrada(ultimo_cierre, venta.FechaVenta)) for venta in ventas]


@router.get("/{venta_id}", response_model=VentaOut, summary="Detalle de venta")
def obtener_venta(
    venta_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_cajero_or_admin),
):
    venta = (
        db.query(Venta)
        .options(joinedload(Venta.detalles), joinedload(Venta.usuario))
        .filter(Venta.Id == venta_id)
        .first()
    )
    if not venta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")
    return venta_a_out(venta, _caja_cerrada(_ultimo_cierre(db), venta.FechaVenta))


@router.put("/{venta_id}", response_model=VentaOut, summary="Editar factura e items (Admin)")
def actualizar_venta(
    venta_id: int,
    datos: EditarVentaRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("factura.editar")),
):
    return editar_venta(db, venta_id, datos, current_user)


@router.get("/{venta_id}/invoice", summary="Datos para ticket térmico")
def ticket_factura(
    venta_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_cajero_or_admin),
):
    venta = db.query(Venta).options(joinedload(Venta.detalles)).filter(Venta.Id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")
    return build_invoice_payload(db, venta, current_user)
