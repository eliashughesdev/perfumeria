"""Control de caja y arqueo.

Reglas:
- Solo ROLE_ADMIN puede abrir o cerrar la caja.
- Los movimientos de ingreso/egreso requieren el permiso `caja.movimientos`.
- El cierre registra el efectivo contado y la diferencia contra el esperado.
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin, require_cajero_or_admin, require_permission
from app.models import MovimientoCaja, Usuario
from app.schemas import (
    CierreCajaRequest,
    MovimientoCajaCreate,
    MovimientoCajaOut,
    ResumenCajaOut,
)
from app.services.cash_service import (
    build_current_summary,
    build_date_summary,
    get_open_shift,
    get_shift,
)

router = APIRouter(tags=["Caja y Arqueo"])


@router.post("/apertura", response_model=MovimientoCajaOut, status_code=status.HTTP_201_CREATED, summary="Abrir caja (Admin)")
def apertura_caja(
    monto: Decimal,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    if monto < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El fondo inicial no puede ser negativo.")
    if get_open_shift(db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una caja abierta. Debe cerrarla antes de abrir un nuevo turno.",
        )

    movimiento = MovimientoCaja(
        Tipo="Apertura",
        Concepto="Fondo inicial de gaveta",
        MetodoPago="Efectivo",
        Monto=monto,
        IdUsuario=current_user.Id,
    )
    db.add(movimiento)
    db.commit()
    db.refresh(movimiento)
    return movimiento


@router.post("/movimiento", response_model=MovimientoCajaOut, summary="Registrar ingreso/egreso de caja")
def registrar_movimiento(
    mov_in: MovimientoCajaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("caja.movimientos")),
):
    if mov_in.Tipo not in ("Ingreso", "Egreso"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de movimiento inválido. Use 'Ingreso' o 'Egreso'.",
        )
    if not get_open_shift(db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La caja está cerrada. Solicite al administrador abrir el turno.",
        )

    movimiento = MovimientoCaja(
        Tipo=mov_in.Tipo,
        Concepto=mov_in.Concepto,
        MetodoPago=mov_in.MetodoPago or "Efectivo",
        Monto=mov_in.Monto,
        IdUsuario=current_user.Id,
        IdVenta=mov_in.IdVenta,
    )
    db.add(movimiento)
    db.commit()
    db.refresh(movimiento)
    return movimiento


@router.get("/resumen", response_model=ResumenCajaOut, summary="Resumen de caja")
def resumen_caja(
    fecha: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_cajero_or_admin),
):
    if not fecha:
        return build_current_summary(db)
    try:
        fecha_obj = datetime.strptime(fecha, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fecha inválida (YYYY-MM-DD)")
    return build_date_summary(db, fecha_obj)


@router.get("/movimientos", response_model=List[MovimientoCajaOut], summary="Listar movimientos del turno")
def listar_movimientos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_cajero_or_admin),
    limite: int = 100,
):
    apertura, cierre = get_shift(db)
    q = db.query(MovimientoCaja)
    if apertura:
        inicio = apertura.FechaMovimiento
        fin = cierre.FechaMovimiento if cierre else datetime.now()
        q = q.filter(MovimientoCaja.FechaMovimiento >= inicio, MovimientoCaja.FechaMovimiento <= fin)
    return q.order_by(MovimientoCaja.FechaMovimiento.desc(), MovimientoCaja.Id.desc()).limit(limite).all()


@router.post("/cierre", summary="Cerrar caja y registrar arqueo (Admin)")
def cierre_caja(
    payload: Optional[CierreCajaRequest] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    apertura = get_open_shift(db)
    if not apertura:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No existe una caja abierta para cerrar.")

    resumen = build_current_summary(db)
    esperado = resumen["EfectivoEsperado"]
    contado = payload.MontoContado if payload and payload.MontoContado is not None else None
    diferencia = (contado - esperado) if contado is not None else None

    cierre = MovimientoCaja(
        Tipo="Cierre",
        Concepto="Arqueo de turno",
        MetodoPago="Efectivo",
        Monto=esperado,
        MontoContado=contado,
        Diferencia=diferencia,
        IdUsuario=current_user.Id,
    )
    db.add(cierre)
    db.commit()
    db.refresh(cierre)

    return {
        "message": "Caja cerrada y arqueo registrado",
        "cierre": MovimientoCajaOut.model_validate(cierre),
        "resumen": build_current_summary(db),
    }
