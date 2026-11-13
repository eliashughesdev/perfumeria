"""Dependencias de autenticación y control de acceso RBAC.

- get_current_user: extrae el usuario autenticado desde el token JWT
- require_admin: solo permite ROLE_ADMIN
- require_cajero_or_admin: permite ambos roles
"""

from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import SessionLocal, get_db
from app.security import decode_token
from app.models import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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
    usuario = db.query(Usuario).filter(Usuario.Email == email, Usuario.Activo == True).first()
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
