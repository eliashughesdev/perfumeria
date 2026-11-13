"""Conexión a base de datos mediante SQLAlchemy.

Por defecto usa Microsoft SQL Server + pyodbc.
Para tests se sobrescribe DATABASE_URL con SQLite.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

_connect_args = {}
_engine_kwargs = {
    "pool_pre_ping": True,
    "pool_recycle": 1800,
    "echo": settings.DEBUG,
}

# fast_executemany solo es válido para pyodbc (SQL Server)
if settings.DATABASE_URL.startswith("mssql+"):
    _engine_kwargs["fast_executemany"] = True

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=_connect_args,
    **_engine_kwargs,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency que provee una sesión de base de datos por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
