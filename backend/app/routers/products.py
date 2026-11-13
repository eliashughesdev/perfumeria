"""Router de Productos (Inventario de Fragancias).

Endpoints RBAC:
  GET    /api/products              - Listar productos (todos los roles)
  GET    /api/products/{id}         - Obtener producto por ID (todos los roles)
  POST   /api/products              - Crear producto (solo ROLE_ADMIN)
  PUT    /api/products/{id}         - Actualizar producto (solo ROLE_ADMIN)
  DELETE /api/products/{id}         - Eliminar producto (solo ROLE_ADMIN)

El costo solo es visible para ROLE_ADMIN (RBAC a nivel de esquema de respuesta).
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.database import get_db
from app.models import Producto, Usuario
from app.schemas import ProductoOut, ProductoCreate, ProductoUpdate
from app.dependencies import get_current_user, require_admin, require_cajero_or_admin

router = APIRouter(tags=["Productos"])


def _producto_a_out(producto: Producto, rol: str) -> ProductoOut:
    """Convierte un modelo ORM a esquema de salida aplicando RBAC en el costo."""
    data = {
        "Id": producto.Id,
        "SKU": producto.SKU,
        "Nombre": producto.Nombre,
        "Descripcion": producto.Descripcion,
        "Categoria": producto.Categoria,
        "Costo": producto.Costo if rol == "ROLE_ADMIN" else None,
        "PrecioVenta": producto.PrecioVenta,
        "StockActual": producto.StockActual,
        "StockMinimo": producto.StockMinimo,
        "ImagenUrl": producto.ImagenUrl,
        "Activo": producto.Activo,
        "FechaCreacion": producto.FechaCreacion,
        "FechaActualizacion": producto.FechaActualizacion,
    }
    return ProductoOut(**data)


@router.get("", response_model=List[ProductoOut], summary="Listar productos")
def listar_productos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_cajero_or_admin),
    categoria: Optional[str] = Query(None),
    activo: bool = Query(True),
    buscar: Optional[str] = Query(None),
):
    q = db.query(Producto)
    if activo:
        q = q.filter(Producto.Activo == True)
    if categoria:
        q = q.filter(Producto.Categoria == categoria)
    if buscar:
        like = f"%{buscar}%"
        q = q.filter(
            (Producto.Nombre.ilike(like))
            | (Producto.SKU.ilike(like))
            | (Producto.Descripcion.ilike(like))
        )
    productos = q.order_by(Producto.Id.desc()).all()
    return [_producto_a_out(p, current_user.Rol) for p in productos]


@router.get("/{producto_id}", response_model=ProductoOut, summary="Obtener producto por ID")
def obtener_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_cajero_or_admin),
):
    producto = db.query(Producto).filter(Producto.Id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return _producto_a_out(producto, current_user.Rol)


@router.post("", response_model=ProductoOut, status_code=status.HTTP_201_CREATED, summary="Crear producto (Admin)")
def crear_producto(
    producto_in: ProductoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    existente = db.query(Producto).filter(Producto.SKU == producto_in.SKU).first()
    if existente:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El SKU ya existe")
    producto = Producto(**producto_in.model_dump())
    db.add(producto)
    db.commit()
    db.refresh(producto)
    return _producto_a_out(producto, current_user.Rol)


@router.put("/{producto_id}", response_model=ProductoOut, summary="Actualizar producto (Admin)")
def actualizar_producto(
    producto_id: int,
    producto_in: ProductoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    producto = db.query(Producto).filter(Producto.Id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    update_data = producto_in.model_dump(exclude_unset=True)
    for campo, valor in update_data.items():
        setattr(producto, campo, valor)
    from datetime import datetime
    producto.FechaActualizacion = datetime.now()
    db.commit()
    db.refresh(producto)
    return _producto_a_out(producto, current_user.Rol)


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar producto (Admin)")
def eliminar_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    producto = db.query(Producto).filter(Producto.Id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    db.delete(producto)
    db.commit()
    return None
