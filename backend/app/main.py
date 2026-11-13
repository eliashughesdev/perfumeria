"""Punto de entrada de la API FastAPI - L'ESSENCE POS.
Puerto: 8050
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base
from app.routers import auth, products, sales, caja, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear tablas al iniciar (en producción usar Alembic migrations)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API del Sistema POS para Perfumería L'ESSENCE - Backend FastAPI + SQL Server",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS para el frontend React (puerto 3050) y despliegue IIS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "port": settings.API_PORT,
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}


# Routers de la API
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticación"])
app.include_router(products.router, prefix="/api/products", tags=["Productos"])
app.include_router(sales.router, prefix="/api/sales", tags=["Ventas"])
app.include_router(caja.router, prefix="/api/caja", tags=["Caja y Arqueo"])
app.include_router(users.router, prefix="/api/users", tags=["Usuarios y RBAC"])
