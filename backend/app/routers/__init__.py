"""Paquete de routers de la API."""

from app.routers import auth, products, sales, caja, users  # noqa: F401

__all__ = ["auth", "products", "sales", "caja", "users"]
