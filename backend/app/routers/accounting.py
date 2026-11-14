"""Router de contabilidad avanzada (solo permiso contabilidad.ver)."""

import csv
import io
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_permission
from app.models import Usuario
from app.schemas import ContabilidadReporteOut
from app.services.accounting_service import build_report

router = APIRouter(tags=["Contabilidad"])


def _rango(desde: Optional[str], hasta: Optional[str]) -> tuple[date, date]:
    hoy = date.today()
    try:
        fecha_desde = datetime.strptime(desde, "%Y-%m-%d").date() if desde else hoy.replace(day=1)
        fecha_hasta = datetime.strptime(hasta, "%Y-%m-%d").date() if hasta else hoy
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fecha inválida (YYYY-MM-DD)")
    if fecha_desde > fecha_hasta:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El rango de fechas es inválido")
    return fecha_desde, fecha_hasta


@router.get("/reporte", response_model=ContabilidadReporteOut, summary="Reporte contable del período")
def reporte(
    desde: Optional[str] = None,
    hasta: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("contabilidad.ver")),
):
    fecha_desde, fecha_hasta = _rango(desde, hasta)
    return build_report(db, fecha_desde, fecha_hasta)


@router.get("/reporte.csv", summary="Exportar reporte contable a CSV")
def reporte_csv(
    desde: Optional[str] = None,
    hasta: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("contabilidad.ver")),
):
    fecha_desde, fecha_hasta = _rango(desde, hasta)
    reporte_data = build_report(db, fecha_desde, fecha_hasta)

    buffer = io.StringIO()
    writer = csv.writer(buffer, delimiter=";")
    writer.writerow(["Reporte contable Nurfa Essencial"])
    writer.writerow(["Desde", reporte_data["Desde"], "Hasta", reporte_data["Hasta"]])
    writer.writerow([])
    writer.writerow(["Indicador", "Valor"])
    for clave, valor in reporte_data["Totales"].items():
        writer.writerow([clave, valor])
    writer.writerow([])
    writer.writerow(["Fecha", "Ventas", "Costo", "Utilidad"])
    for punto in reporte_data["SerieDiaria"]:
        writer.writerow([punto["Fecha"], punto["Ventas"], punto["Costo"], punto["Utilidad"]])
    writer.writerow([])
    writer.writerow(["Producto", "SKU", "Unidades", "Ventas", "Costo", "Utilidad"])
    for producto in reporte_data["TopProductos"]:
        writer.writerow(
            [
                producto["Nombre"],
                producto["SKU"],
                producto["Unidades"],
                producto["Ventas"],
                producto["Costo"],
                producto["Utilidad"],
            ]
        )

    contenido = "\ufeff" + buffer.getvalue()
    return StreamingResponse(
        iter([contenido]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="contabilidad_{fecha_desde}_{fecha_hasta}.csv"'},
    )
