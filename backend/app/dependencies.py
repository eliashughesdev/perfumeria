"""Dependencias de autenticación y control de acceso RBAC/permisos."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Usuario
from app.permissions import has_permission
from app.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

DbSession = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(oauth2_scheme)]


def get_current_user(token: TokenDep, db: DbSession) -> Usuario:
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no contiene información de usuario",
            headers={"WWW-Authenticate": "Bearer"},
        )
    usuario = (
        db.query(Usuario)
        .filter(func.lower(Usuario.Email) == email.strip().lower(), Usuario.Activo == True)
        .first()
    )
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o inactivo",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return usuario


def require_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.Rol != "ROLE_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Se requiere rol de Administrador (ROLE_ADMIN).",
        )
    return current_user


def require_cajero_or_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.Rol not in ("ROLE_ADMIN", "ROLE_CAJERO"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Rol no autorizado para esta operación.",
        )
    return current_user


def require_permission(permission: str):
    """Genera una dependencia que exige un permiso granular concreto."""

    def dependency(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        if not has_permission(current_user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado: falta el permiso '{permission}'.",
            )
        return current_user

    return dependency
