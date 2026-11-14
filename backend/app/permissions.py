"""Catálogo y resolución de permisos granulares por usuario.

Los permisos se almacenan en la columna `Usuarios.Permisos` como una lista
separada por comas. El rol ROLE_ADMIN siempre conserva todos los permisos para
evitar bloqueos administrativos; ROLE_CAJERO recibe los permisos concedidos por
el administrador.
"""

from typing import Iterable, List, Optional

from app.models import Usuario


PERMISSION_CATALOG = {
    "pos.vender": {"grupo": "Punto de Venta", "etiqueta": "Facturar en POS"},
    "pos.descuentos": {"grupo": "Punto de Venta", "etiqueta": "Aplicar descuentos"},
    "inventario.ver": {"grupo": "Inventario", "etiqueta": "Ver productos y stock"},
    "inventario.costos": {"grupo": "Inventario", "etiqueta": "Ver costos y márgenes"},
    "inventario.editar": {"grupo": "Inventario", "etiqueta": "Crear, editar y eliminar productos"},
    "caja.movimientos": {"grupo": "Caja", "etiqueta": "Registrar ingresos y egresos"},
    "caja.apertura_cierre": {"grupo": "Caja", "etiqueta": "Abrir y cerrar caja"},
    "contabilidad.ver": {"grupo": "Contabilidad", "etiqueta": "Ver reportes contables"},
    "factura.editar": {"grupo": "Facturación", "etiqueta": "Editar facturas emitidas"},
    "factura.configurar": {"grupo": "Facturación", "etiqueta": "Configurar empresa y ticket"},
    "usuarios.gestionar": {"grupo": "Usuarios", "etiqueta": "Administrar usuarios y permisos"},
}

ALL_PERMISSIONS: List[str] = list(PERMISSION_CATALOG.keys())

DEFAULT_ROLE_PERMISSIONS = {
    "ROLE_ADMIN": ALL_PERMISSIONS,
    "ROLE_CAJERO": [
        "pos.vender",
        "pos.descuentos",
        "inventario.ver",
        "caja.movimientos",
    ],
}


def normalize_permissions(values: Optional[Iterable[str]]) -> List[str]:
    """Filtra claves desconocidas, elimina duplicados y conserva el orden del catálogo."""
    if not values:
        return []
    requested = {str(value).strip() for value in values if str(value).strip()}
    return [key for key in PERMISSION_CATALOG if key in requested]


def serialize_permissions(values: Optional[Iterable[str]]) -> str:
    return ",".join(normalize_permissions(values))


def parse_permissions(raw: Optional[str]) -> List[str]:
    if not raw:
        return []
    return normalize_permissions(raw.split(","))


def permissions_for(user: Usuario) -> List[str]:
    if user.Rol == "ROLE_ADMIN":
        return list(ALL_PERMISSIONS)
    stored = parse_permissions(user.Permisos)
    return stored if stored else list(DEFAULT_ROLE_PERMISSIONS["ROLE_CAJERO"])


def has_permission(user: Usuario, permission: str) -> bool:
    return permission in permissions_for(user)
