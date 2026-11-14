"""Router de Usuarios y permisos granulares (solo administradores)."""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models import Usuario
from app.permissions import (
    ALL_PERMISSIONS,
    DEFAULT_ROLE_PERMISSIONS,
    PERMISSION_CATALOG,
    normalize_permissions,
)
from app.schemas import UsuarioCreate, UsuarioOut, UsuarioUpdate
from app.security import hash_password
from app.services.user_service import permisos_para_guardar, usuario_a_out

router = APIRouter(tags=["Usuarios y RBAC"])

ROLES_VALIDOS = {"ROLE_ADMIN", "ROLE_CAJERO"}


@router.get("/permissions", summary="Catálogo de permisos y roles")
def catalogo_permisos(current_user: Usuario = Depends(require_admin)):
    return {
        "roles": sorted(ROLES_VALIDOS),
        "permisos": [
            {"clave": clave, "etiqueta": data["etiqueta"], "grupo": data["grupo"]}
            for clave, data in PERMISSION_CATALOG.items()
        ],
        "por_rol": {
            "ROLE_ADMIN": ALL_PERMISSIONS,
            "ROLE_CAJERO": DEFAULT_ROLE_PERMISSIONS["ROLE_CAJERO"],
        },
    }


@router.get("", response_model=List[UsuarioOut], summary="Listar usuarios (Admin)")
def listar_usuarios(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    usuarios = db.query(Usuario).order_by(Usuario.Id.desc()).all()
    return [usuario_a_out(usuario) for usuario in usuarios]


@router.get("/{usuario_id}", response_model=UsuarioOut, summary="Obtener usuario por ID (Admin)")
def obtener_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    usuario = db.query(Usuario).filter(Usuario.Id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return usuario_a_out(usuario)


@router.post("", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED, summary="Crear usuario (Admin)")
def crear_usuario(
    usuario_in: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    if usuario_in.Rol not in ROLES_VALIDOS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rol inválido")
    existente = db.query(Usuario).filter(Usuario.Email == usuario_in.Email).first()
    if existente:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El email ya está registrado")

    usuario = Usuario(
        Nombre=usuario_in.Nombre,
        Email=usuario_in.Email,
        PasswordHash=hash_password(usuario_in.Password),
        Rol=usuario_in.Rol,
        Permisos=permisos_para_guardar(usuario_in.Rol, usuario_in.Permisos),
        Activo=usuario_in.Activo,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario_a_out(usuario)


@router.put("/{usuario_id}", response_model=UsuarioOut, summary="Actualizar usuario y permisos (Admin)")
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

    if update_data.get("Rol") and update_data["Rol"] not in ROLES_VALIDOS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rol inválido")
    if usuario.Id == current_user.Id and update_data.get("Rol") not in (None, "ROLE_ADMIN"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No puede quitarse el rol de administrador")
    if usuario.Id == current_user.Id and update_data.get("Activo") is False:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No puede desactivar su propio usuario")

    if "Email" in update_data and update_data["Email"] != usuario.Email:
        duplicado = db.query(Usuario).filter(Usuario.Email == update_data["Email"]).first()
        if duplicado:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El email ya está registrado")

    if update_data.get("Password"):
        usuario.PasswordHash = hash_password(update_data.pop("Password"))
    else:
        update_data.pop("Password", None)

    rol_final = update_data.get("Rol", usuario.Rol)
    if "Permisos" in update_data or "Rol" in update_data:
        permisos = update_data.pop("Permisos", None)
        if permisos is None and rol_final == usuario.Rol:
            permisos = normalize_permissions(usuario.Permisos.split(",") if usuario.Permisos else None)
        usuario.Permisos = permisos_para_guardar(rol_final, permisos)

    for campo, valor in update_data.items():
        setattr(usuario, campo, valor)

    usuario.FechaActualizacion = datetime.now()
    db.commit()
    db.refresh(usuario)
    return usuario_a_out(usuario)


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
    usuario.FechaActualizacion = datetime.now()
    db.commit()
    return None
