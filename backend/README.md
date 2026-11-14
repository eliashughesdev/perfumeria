# NURFA ESSENCIAL POS - Backend FastAPI + SQL Server
# Ejecutar en puerto 8050
#
# Requisitos previos:
#   1. Microsoft SQL Server instalado y en ejecución
#   2. ODBC Driver 17 for SQL Server instalado
#   3. Base de datos creada con el script: backend/01_DDL_SQLServer.sql
#
# Pasos para ejecutar en desarrollo:
#
#   1. Crear entorno virtual:
#      python -m venv venv
#      .\venv\Scripts\Activate.ps1
#
#   2. Instalar dependencias:
#      pip install -r requirements.txt
#
#   3. Configurar variables de entorno:
#      Copy .env.example .env
#      # Editar .env con los datos de conexión a SQL Server
#
#   4. Ejecutar el servidor:
#      uvicorn app.main:app --host 0.0.0.0 --port 8050 --reload
#
# Documentación automática:
#   http://localhost:8050/docs
#   http://localhost:8050/redoc
