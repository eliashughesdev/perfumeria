"""Configuración de pruebas para el backend NURFA ESSENCIAL POS.

Usa SQLite en memoria para no depender de SQL Server durante los tests.
Sobreescribe la dependencia get_db de la app FastAPI.
"""

import os
import sys

# Forzar variables de entorno de prueba antes de importar la app
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-do-not-use-in-production"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "480"
os.environ["CORS_ORIGINS"] = "http://localhost:3050"
os.environ["AUTO_SEED"] = "false"

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from starlette.testclient import TestClient

from app.main import app as fastapi_app
from app.database import Base, get_db
from app.models import Usuario, Producto, Venta, DetalleVenta, MovimientoCaja, ConfiguracionEmpresa
from app.security import hash_password, create_access_token

# ---------------------------------------------------------------------------
# Motor SQLite en memoria (compartido entre todos los tests de la sesión)
# ---------------------------------------------------------------------------
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session", autouse=True)
def create_test_schema():
    """Crea todas las tablas una sola vez al iniciar la sesión de tests."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session(create_test_schema):
    """Sesión de DB transaccional por test (rollback automático)."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    """Cliente HTTP síncrono de FastAPI con dependencia get_db sobreescrita."""

    def override_get_db():
        yield db_session

    fastapi_app.dependency_overrides[get_db] = override_get_db

    with TestClient(fastapi_app) as test_client:
        yield test_client

    fastapi_app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Usuarios de prueba
# ---------------------------------------------------------------------------


@pytest.fixture()
def admin_user(db_session):
    user = Usuario(
        Nombre="Ana Gómez",
        Email="admin@nurfaessencial.com",
        PasswordHash=hash_password("Admin123!"),
        Rol="ROLE_ADMIN",
        Activo=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def cajero_user(db_session):
    user = Usuario(
        Nombre="Carlos Méndez",
        Email="caja1@nurfaessencial.com",
        PasswordHash=hash_password("Admin123!"),
        Rol="ROLE_CAJERO",
        Activo=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def admin_token(admin_user):
    return create_access_token({"sub": admin_user.Email, "rol": admin_user.Rol, "usuario_id": admin_user.Id})


@pytest.fixture()
def cajero_token(cajero_user):
    return create_access_token({"sub": cajero_user.Email, "rol": cajero_user.Rol, "usuario_id": cajero_user.Id})


@pytest.fixture()
def config_empresa(db_session):
    cfg = ConfiguracionEmpresa(
        NombreComercial="NURFA ESSENCIAL PERFUMERÍA",
        RazonSocial="INVERSIONES AROMAS DEL CARIBE SRL",
        RNC="1-31-84920-5",
        NCFSerie="B02",
        NCFSecuenciaActual=41,
        ITBISPorcentaje=18.00,
        MonedaSimbolo="$",
        Activo=True,
    )
    db_session.add(cfg)
    db_session.commit()
    db_session.refresh(cfg)
    return cfg
