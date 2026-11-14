"""Utilidades compartidas para usuarios y permisos."""

from typing import Iterable, Optional

from app.models import Usuario
from app.permissions import (
    ALL_PERMISSIONS,
    DEFAULT_ROLE_PERMISSIONS,
    normalize_permissions,
    permissions_for,
    serialize_permissions,
)
from app.schemas import UsuarioOut


def usuario_a_out(usuario: Usuario) -> UsuarioOut:
    return UsuarioOut(
        Id=usuario.Id,
        Nombre=usuario.Nombre,
        Email=usuario.Email,
        Rol=usuario.Rol,
        Activo=usuario.Activo,
        Permisos=permissions_for(usuario),
        FechaCreacion=usuario.FechaCreacion,
    )


def permisos_para_guardar(rol: str, permisos: Optional[Iterable[str]]) -> str:
    if rol == "ROLE_ADMIN":
        return serialize_permissions(ALL_PERMISSIONS)
    seleccionados = normalize_permissions(permisos)
    if not seleccionados:
        seleccionados = list(DEFAULT_ROLE_PERMISSIONS["ROLE_CAJERO"])
    return serialize_permissions(seleccionados)
