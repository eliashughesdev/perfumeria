"""Lógica de turnos de caja, arqueo y efectivo esperado."""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session

from app.models import MovimientoCaja


ZERO = Decimal("0")


def _ultimo(db: Session, tipo: str) -> Optional[MovimientoCaja]:
    return (
        db.query(MovimientoCaja)
        .filter(MovimientoCaja.Tipo == tipo)
        .order_by(MovimientoCaja.Id.desc())
        .first()
    )


def get_open_shift(db: Session) -> Optional[MovimientoCaja]:
    """Devuelve la apertura vigente o None si la caja está cerrada."""
    apertura = _ultimo(db, "Apertura")
    if not apertura:
        return None
    cierre = _ultimo(db, "Cierre")
    if cierre and cierre.Id > apertura.Id:
        return None
    return apertura


def get_shift(db: Session) -> tuple[Optional[MovimientoCaja], Optional[MovimientoCaja]]:
    apertura = _ultimo(db, "Apertura")
    cierre = _ultimo(db, "Cierre")
    if apertura and cierre and cierre.Id < apertura.Id:
        cierre = None
    return apertura, cierre


def _totales(movimientos) -> dict:
    fondo = ZERO
    ventas_efectivo = ZERO
    ventas_no_efectivo = ZERO
    ingresos = ZERO
    egresos = ZERO

    for movimiento in movimientos:
        if movimiento.Tipo == "Apertura":
            fondo += movimiento.Monto
        elif movimiento.Tipo == "Venta":
            if movimiento.MetodoPago == "Efectivo":
                ventas_efectivo += movimiento.Monto
            else:
                ventas_no_efectivo += movimiento.Monto
        elif movimiento.Tipo == "Ingreso":
            ingresos += movimiento.Monto
        elif movimiento.Tipo == "Egreso":
            egresos += movimiento.Monto

    return {
        "FondoInicial": fondo,
        "VentasEfectivo": ventas_efectivo,
        "VentasNoEfectivo": ventas_no_efectivo,
        "IngresosExtra": ingresos,
        "EgresosExtra": egresos,
        "EfectivoEsperado": fondo + ventas_efectivo + ingresos - egresos,
    }


def build_current_summary(db: Session) -> dict:
    apertura, cierre = get_shift(db)

    if not apertura:
        return {
            "Fecha": datetime.now().date().isoformat(),
            "Estado": "Sin apertura",
            "Abierta": False,
            "FechaApertura": None,
            "FechaCierre": None,
            **_totales([]),
            "MontoContado": None,
            "Diferencia": None,
        }

    inicio = apertura.FechaMovimiento
    fin = cierre.FechaMovimiento if cierre else datetime.now()
    movimientos = (
        db.query(MovimientoCaja)
        .filter(MovimientoCaja.FechaMovimiento >= inicio, MovimientoCaja.FechaMovimiento <= fin)
        .order_by(MovimientoCaja.FechaMovimiento.asc(), MovimientoCaja.Id.asc())
        .all()
    )
    totales = _totales(movimientos)

    return {
        "Fecha": inicio.date().isoformat(),
        "Estado": "Abierta" if not cierre else "Cerrada",
        "Abierta": cierre is None,
        "FechaApertura": inicio,
        "FechaCierre": cierre.FechaMovimiento if cierre else None,
        **totales,
        "MontoContado": cierre.MontoContado if cierre else None,
        "Diferencia": cierre.Diferencia if cierre else None,
    }


def build_date_summary(db: Session, fecha: datetime.date) -> dict:
    inicio = datetime(fecha.year, fecha.month, fecha.day)
    fin = datetime(fecha.year, fecha.month, fecha.day, 23, 59, 59, 999999)
    movimientos = (
        db.query(MovimientoCaja)
        .filter(MovimientoCaja.FechaMovimiento.between(inicio, fin))
        .order_by(MovimientoCaja.FechaMovimiento.asc(), MovimientoCaja.Id.asc())
        .all()
    )
    totales = _totales(movimientos)
    aperturas = [m for m in movimientos if m.Tipo == "Apertura"]
    cierres = [m for m in movimientos if m.Tipo == "Cierre"]
    ultimo_cierre = cierres[-1] if cierres else None

    return {
        "Fecha": fecha.isoformat(),
        "Estado": "Cerrada" if ultimo_cierre else ("Abierta" if aperturas else "Sin apertura"),
        "Abierta": bool(aperturas) and ultimo_cierre is None,
        "FechaApertura": aperturas[-1].FechaMovimiento if aperturas else None,
        "FechaCierre": ultimo_cierre.FechaMovimiento if ultimo_cierre else None,
        **totales,
        "MontoContado": ultimo_cierre.MontoContado if ultimo_cierre else None,
        "Diferencia": ultimo_cierre.Diferencia if ultimo_cierre else None,
    }
