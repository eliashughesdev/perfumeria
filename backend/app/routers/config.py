"""Configuración de empresa, datos fiscales y diseño del ticket."""

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_cajero_or_admin, require_permission
from app.models import Usuario
from app.schemas import (
    ConfiguracionEmpresaOut,
    ConfiguracionEmpresaUpdate,
    ConfiguracionFacturaOut,
    ConfiguracionFacturaUpdate,
)
from app.services.invoice_service import get_or_create_company, get_or_create_invoice_config

router = APIRouter(tags=["Configuración"])


@router.get("", response_model=ConfiguracionEmpresaOut, summary="Datos de la empresa")
def obtener_empresa(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_cajero_or_admin),
):
    return get_or_create_company(db)


@router.put("", response_model=ConfiguracionEmpresaOut, summary="Actualizar empresa y datos fiscales")
def actualizar_empresa(
    datos: ConfiguracionEmpresaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("factura.configurar")),
):
    empresa = get_or_create_company(db)
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(empresa, campo, valor)
    empresa.FechaActualizacion = datetime.now()
    db.commit()
    db.refresh(empresa)
    return empresa


@router.get("/factura", response_model=ConfiguracionFacturaOut, summary="Diseño del ticket")
def obtener_factura(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_cajero_or_admin),
):
    return get_or_create_invoice_config(db)


@router.put("/factura", response_model=ConfiguracionFacturaOut, summary="Actualizar diseño del ticket")
def actualizar_factura(
    datos: ConfiguracionFacturaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_permission("factura.configurar")),
):
    config = get_or_create_invoice_config(db)
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(config, campo, valor)
    config.FechaActualizacion = datetime.now()
    db.commit()
    db.refresh(config)
    return config
