"""Configuración de la aplicación usando pydantic-settings.
Lee las variables de entorno desde el archivo .env
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Nurfa Essenci Perfumería API"
    APP_VERSION: str = "1.1.0"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8050
    DEBUG: bool = True
    RELOAD: bool = True
    AUTO_SEED: bool = False

    # Base de datos SQL Server
    DATABASE_URL: str = (
        "mssql+pyodbc://localhost/LesserencePOSDB?"
        "driver=ODBC+Driver+17+for+SQL+Server&Trusted_Connection=yes"
    )

    # Seguridad JWT
    SECRET_KEY: str = "cambiar_esta_clave_secreta_en_produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: str = "http://localhost:3050,http://127.0.0.1:3050"

    # Fiscal
    ITBIS_PORCENTAJE: float = 18.00
    MONEDA_SIMBOLO: str = "$"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
