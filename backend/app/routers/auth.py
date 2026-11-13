"""Router de Autenticación y Seguridad JWT.

Endpoints:
  POST /api/auth/login       - Autentica usuario y devuelve access/refresh token
  POST /api/auth/refresh     - Renueva access token usando refresh token
  POST /api/auth/logout      - Invalida sesión (cliente debe eliminar token)
  GET  /api/auth/me          - Devuelve el usuario autenticado actual
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.schemas import LoginRequest, Token, UsuarioOut, TokenData
from app.models import Usuario
from app.dependencies import get_current_user

router = APIRouter(tags=["Autenticación"])


@router.post("/login", response_model=Token, summary="Iniciar sesión (JWT)")
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.Email == login_data.email).first()
    if not usuario or not verify_password(login_data.password, usuario.PasswordHash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not usuario.Activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo. Contacte al administrador.",
        )

    token_data = {"sub": usuario.Email, "rol": usuario.Rol, "usuario_id": usuario.Id}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        rol=usuario.Rol,
        nombre=usuario.Nombre,
        email=usuario.Email,
    )


@router.post("/refresh", response_model=Token, summary="Renovar access token")
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    payload = decode_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido",
        )
    email = payload.get("sub")
    rol = payload.get("rol")
    usuario = db.query(Usuario).filter(Usuario.Email == email).first()
    if not usuario or not usuario.Activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o inactivo",
        )

    token_data = {"sub": usuario.Email, "rol": usuario.Rol, "usuario_id": usuario.Id}
    access_token = create_access_token(token_data)
    new_refresh = create_refresh_token(token_data)

    return Token(
        access_token=access_token,
        refresh_token=new_refresh,
        rol=usuario.Rol,
        nombre=usuario.Nombre,
        email=usuario.Email,
    )


@router.post("/logout", summary="Cerrar sesión")
def logout():
    # En una implementación con lista negra de tokens (Redis/DB) se invalidaría aquí.
    return {"message": "Sesión cerrada. Elimine el token del cliente."}


@router.get("/me", response_model=UsuarioOut, summary="Usuario autenticado actual")
def me(current_user: Usuario = Depends(get_current_user)):
    return current_user
