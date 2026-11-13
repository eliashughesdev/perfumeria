"""Router de Usuarios y Matriz de Permisos RBAC.

Endpoints (solo ROLE_ADMIN):
  GET    /api/users              - Listar todos los usuarios
  GET    /api/users/{id}         - Obtener usuario por ID
  POST   /api/users              - Crear nuevo usuario
  PUT    /api/users/{id}         - Actualizar usuario (rol, activo, password)
  DELETE /api/users/{id}         - Desactivar usuario (borrado lógico)
  GET    /api/users/permissions  - Matriz de permisos por rol
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Usuario
from app.schemas import UsuarioOut, UsuarioCreate, UsuarioUpdate
from app.security import hash_password
from app.dependencies import get_current_user, require_admin

router = APIRouter(tags=["Usuarios y RBAC"])


@router.get("", response_model=List[UsuarioOut], summary="Listar usuarios (Admin)")
def listar_usuarios(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    return db.query(Usuario).order_by(Usuario.Id.desc()).all()


@router.get("/{usuario_id}", response_model=UsuarioOut, summary="Obtener usuario por ID (Admin)")
def obtener_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    usuario = db.query(Usuario).filter(Usuario.Id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return usuario


@router.post("", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED, summary="Crear usuario (Admin)")
def crear_usuario(
    usuario_in: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    existente = db.query(Usuario).filter(Usuario.Email == usuario_in.Email).first()
    if existente:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El email ya está registrado")
    usuario = Usuario(
        Nombre=usuario_in.Nombre,
        Email=usuario_in.Email,
        PasswordHash=hash_password(usuario_in.Password),
        Rol=usuario_in.Rol,
        Activo=usuario_in.Activo,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.put("/{usuario_id}", response_model=UsuarioOut, summary="Actualizar usuario (Admin)")
def actualizar_usuario(
    usuario_id: int,
    usuario_in: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    usuario = db.query(Usuario).filter(Usuario.Id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    update_data = usuario_in.model_dump(exclude_unset=True)
    if "Password" in update_data and update_data["Password"]:
        usuario.PasswordHash = hash_password(update_data.pop("Password"))
    for campo, valor in update_data.items():
        setattr(usuario, campo, valor)
    from datetime import datetime
    usuario.FechaActualizacion = datetime.now()
    db.commit()
    db.refresh(usuario)
    return usuario


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Desactivar usuario (Admin)")
def desactivar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    usuario = db.query(Usuario).filter(Usuario.Id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    if usuario.Id == current_user.Id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se puede desactivar su propio usuario")
    usuario.Activo = False
    from datetime import datetime
    usuario.FechaActualizacion = datetime.now()
    db.commit()
    return None


@router.get("/permissions", summary="Matriz de permisos RBAC")
def matriz_permisos(current_user: Usuario = Depends(require_admin)):
    return {
        "roles": ["ROLE_ADMIN", "ROLE_CAJERO"],
        "modulos": [
            {
                "modulo": "Punto de Venta (POS)",
                "acciones": [
                    {"accion": "Facturar en POS", "admin": True, "cajero": True},
                    {"accion": "Ver catálogo de productos", "admin": True, "cajero": True},
                    {"accion": "Aplicar descuentos", "admin": True, "cajero": True},
                ],
            },
            {
                "modulo": "Control de Caja",
                "acciones": [
                    {"accion": "Apertura y cierre de caja", "admin": True, "cajero": True},
                    {"accion": "Registrar ingreso/egreso de efectivo", "admin": True, "cajero": True},
                    {"accion": "Ver arqueo y efectivo esperado", "admin": True, "cajero": True},
                ],
            },
            {
                "modulo": "Inventario",
                "acciones": [
                    {"accion": "Ver productos y stock", "admin": True, "cajero": True},
                    {"accion": "Ver costos y márgenes", "admin": True, "cajero": False},
                    {"accion": "Crear / editar / eliminar productos", "admin": True, "cajero": False},
                ],
            },
            {
                "modulo": "Contabilidad y Usuarios",
                "acciones": [
                    {"accion": "Ver reportes contables", "admin": True, "cajero": False},
                    {"accion": "Administrar usuarios y roles RBAC", "admin": True, "cajero": False},
                ],
            },
        ],
    }
