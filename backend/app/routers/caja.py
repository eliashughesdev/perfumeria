"""Router de Control de Caja y Turnos (Arqueo).

Endpoints RBAC:
  POST   /api/caja/apertura       - Abrir turno con fondo inicial (Cajero/Admin)
  POST   /api/caja/movimiento     - Registrar ingreso/egreso de efectivo (Cajero/Admin)
  GET    /api/caja/resumen        - Resumen de caja por fecha (Cajero/Admin)
  GET    /api/caja/movimientos    - Listar movimientos de caja (Cajero/Admin)
  POST   /api/caja/cierre         - Cerrar turno y arqueo (Cajero/Admin)

El cálculo de efectivo esperado sigue la lógica del prototipo:
  Efectivo Esperado = Fondo Inicial + Ventas en Efectivo + Ingresos - Egresos
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from app.database import get_db
from app.models import MovimientoCaja, Usuario, Venta
from app.schemas import MovimientoCajaCreate, MovimientoCajaOut, ResumenCajaOut
from app.dependencies import get_current_user, require_cajero_or_admin

router = APIRouter(tags=["Caja y Arqueo"])


@router.post("/apertura", response_model=MovimientoCajaOut, summary="Abrir turno de caja")
def apertura_caja(
    monto: Decimal,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_cajero_or_admin),
):
    hoy = datetime.now().date()
    ya_abierto = (
        db.query(MovimientoCaja)
        .filter(
            MovimientoCaja.Tipo == "Apertura",
            MovimientoCaja.IdUsuario == current_user.Id,
            MovimientoCaja.FechaMovimiento >= datetime(hoy.year, hoy.month, hoy.day),
        )
        .first()
    )
    if ya_abierto:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una apertura de caja registrada para este usuario hoy.",
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
    current_user: Usuario = Depends(require_cajero_or_admin),
):
    if mov_in.Tipo not in ("Ingreso", "Egreso"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de movimiento inválido. Use 'Ingreso' o 'Egreso'.",
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


@router.get("/resumen", response_model=ResumenCajaOut, summary="Resumen de caja por fecha")
def resumen_caja(
    fecha: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_cajero_or_admin),
):
    if fecha:
        try:
            fecha_obj = datetime.strptime(fecha, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fecha inválida (YYYY-MM-DD)")
    else:
        fecha_obj = datetime.now().date()

    inicio = datetime(fecha_obj.year, fecha_obj.month, fecha_obj.day)
    fin = datetime(fecha_obj.year, fecha_obj.month, fecha_obj.day, 23, 59, 59)

    movimientos = (
        db.query(MovimientoCaja)
        .filter(MovimientoCaja.FechaMovimiento.between(inicio, fin))
        .all()
    )

    fondo_inicial = Decimal("0")
    ventas_efectivo = Decimal("0")
    ventas_no_efectivo = Decimal("0")
    ingresos_extra = Decimal("0")
    egresos_extra = Decimal("0")

    for m in movimientos:
        if m.Tipo == "Apertura":
            fondo_inicial += m.Monto
        elif m.Tipo == "Venta":
            if m.MetodoPago == "Efectivo":
                ventas_efectivo += m.Monto
            else:
                ventas_no_efectivo += m.Monto
        elif m.Tipo == "Ingreso":
            ingresos_extra += m.Monto
        elif m.Tipo == "Egreso":
            egresos_extra += m.Monto

    efectivo_esperado = fondo_inicial + ventas_efectivo + ingresos_extra - egresos_extra

    return ResumenCajaOut(
        Fecha=fecha_obj.isoformat(),
        FondoInicial=fondo_inicial,
        VentasEfectivo=ventas_efectivo,
        VentasNoEfectivo=ventas_no_efectivo,
        IngresosExtra=ingresos_extra,
        EgresosExtra=egresos_extra,
        EfectivoEsperado=efectivo_esperado,
    )


@router.get("/movimientos", response_model=List[MovimientoCajaOut], summary="Listar movimientos de caja")
def listar_movimientos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_cajero_or_admin),
    limite: int = 100,
):
    movimientos = (
        db.query(MovimientoCaja)
        .order_by(MovimientoCaja.FechaMovimiento.desc())
        .limit(limite)
        .all()
    )
    return movimientos


@router.post("/cierre", summary="Cerrar turno y realizar arqueo")
def cierre_caja(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_cajero_or_admin),
):
    hoy = datetime.now().date()
    inicio = datetime(hoy.year, hoy.month, hoy.day)
    ya_cerrado = (
        db.query(MovimientoCaja)
        .filter(
            MovimientoCaja.Tipo == "Cierre",
            MovimientoCaja.IdUsuario == current_user.Id,
            MovimientoCaja.FechaMovimiento >= inicio,
        )
        .first()
    )
    if ya_cerrado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El turno ya fue cerrado hoy.",
        )

    resumen = __import__("app.routers.caja", fromlist=["resumen_caja"]).resumen_caja(
        fecha=hoy.isoformat(), db=db, current_user=current_user
    )

    cierre = MovimientoCaja(
        Tipo="Cierre",
        Concepto=f"Arqueo de turno - Efectivo esperado: {resumen.EfectivoEsperado}",
        MetodoPago="Efectivo",
        Monto=resumen.EfectivoEsperado,
        IdUsuario=current_user.Id,
    )
    db.add(cierre)
    db.commit()
    db.refresh(cierre)
    return {"message": "Turno cerrado y arqueo registrado", "cierre": cierre, "resumen": resumen}
