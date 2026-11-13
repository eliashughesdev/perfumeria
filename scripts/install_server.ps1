#!/usr/bin/env pwsh
#=============================================================================
# L'ESSENCE POS - Script de Instalación On-Premise (Windows Server)
#=============================================================================
# Uso tras hacer git clone del repositorio:
#   .\scripts\install_server.ps1
#
# Este script automatiza:
#   1. Verificación de prerrequisitos (Python, Node.js, ODBC Driver 17, NSSM)
#   2. Configuración del backend FastAPI (venv, dependencias, .env)
#   3. Build del frontend React (npm install + npm run build)
#   4. Generación del script de arranque start_api.bat con rutas dinámicas
#=============================================================================

$ErrorActionPreference = "Stop"
$REPO_ROOT = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BACKEND_DIR = Join-Path $REPO_ROOT "backend"
$FRONTEND_DIR = Join-Path $REPO_ROOT "frontend"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  L'ESSENCE POS - Instalador On-Premise" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

#-----------------------------------------------------------------------------
# Función helper
#-----------------------------------------------------------------------------
function Test-CommandExists {
    param([string]$Name)
    return (Get-Command $Name -ErrorAction SilentlyContinue) -ne $null
}

#-----------------------------------------------------------------------------
# 1. Verificar prerrequisitos
#-----------------------------------------------------------------------------
Write-Host "[1/4] Verificando prerrequisitos..." -ForegroundColor Yellow

$missingPrereqs = @()

if (-not (Test-CommandExists "python")) {
    $missingPrereqs += "Python 3.10+ (agregado al PATH)"
}
if (-not (Test-CommandExists "node")) {
    $missingPrereqs += "Node.js 18+ (agregado al PATH)"
}
if (-not (Test-CommandExists "nssm")) {
    $missingPrereqs += "NSSM (https://nssm.cc/, agregado al PATH)"
}

# Verificar ODBC Driver 17 para SQL Server
$odbcRegPath = "HKLM:\SOFTWARE\ODBC\ODBCINST.INI\ODBC Driver 17 for SQL Server"
if (-not (Test-Path $odbcRegPath)) {
    $missingPrereqs += "ODBC Driver 17 for SQL Server"
}

if ($missingPrereqs.Count -gt 0) {
    Write-Host "ERROR: Faltan los siguientes prerrequisitos:" -ForegroundColor Red
    $missingPrereqs | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Por favor, instale los componentes faltantes y vuelva a ejecutar este script." -ForegroundColor Yellow
    exit 1
}

Write-Host "  Todos los prerrequisitos están instalados." -ForegroundColor Green
Write-Host ""

#-----------------------------------------------------------------------------
# 2. Configurar backend FastAPI
#-----------------------------------------------------------------------------
Write-Host "[2/4] Configurando backend FastAPI..." -ForegroundColor Yellow

# Crear entorno virtual si no existe
$VENV_DIR = Join-Path $BACKEND_DIR "venv"
if (-not (Test-Path $VENV_DIR)) {
    Write-Host "  Creando entorno virtual Python..."
    & python -m venv $VENV_DIR
}

$PIP_EXE = Join-Path $VENV_DIR "Scripts\pip.exe"
$PYTHON_EXE = Join-Path $VENV_DIR "Scripts\python.exe"

# Instalar dependencias
Write-Host "  Instalando dependencias de Python..."
& $PIP_EXE install -r (Join-Path $BACKEND_DIR "requirements.txt")

# Generar .env desde .env.example si no existe
$ENV_FILE = Join-Path $BACKEND_DIR ".env"
$ENV_EXAMPLE = Join-Path $BACKEND_DIR ".env.example"
if (-not (Test-Path $ENV_FILE)) {
    Write-Host "  Generando .env desde .env.example..."
    Copy-Item $ENV_EXAMPLE $ENV_FILE
    Write-Host "  IMPORTANTE: Edite `backend/.env` con sus credenciales de SQL Server antes de iniciar el servicio." -ForegroundColor Yellow
} else {
    Write-Host "  El archivo .env ya existe, se omite la generación."
}

Write-Host "  Backend configurado." -ForegroundColor Green
Write-Host ""

#-----------------------------------------------------------------------------
# 3. Build del frontend React
#-----------------------------------------------------------------------------
Write-Host "[3/4] Construyendo frontend React..." -ForegroundColor Yellow

# Instalar dependencias de Node.js
Write-Host "  Instalando dependencias de npm..."
& npm install --prefix $FRONTEND_DIR

# Build de producción
Write-Host "  Ejecutando npm run build..."
& npm run build --prefix $FRONTEND_DIR

Write-Host "  Frontend construido en `frontend/dist/`." -ForegroundColor Green
Write-Host ""

#-----------------------------------------------------------------------------
# 4. Generar start_api.bat con rutas dinámicas
#-----------------------------------------------------------------------------
Write-Host "[4/4] Generando script de arranque del backend..." -ForegroundColor Yellow

$START_API_BAT = Join-Path $BACKEND_DIR "start_api.bat"
$BACKEND_DIR_QUOTED = "`"$BACKEND_DIR`""

$batContent = @"
@echo off
cd /d $BACKEND_DIR_QUOTED
call venv\Scripts\Activate.bat
uvicorn app.main:app --host 0.0.0.0 --port 8050
"@

Set-Content -Path $START_API_BAT -Value $batContent -Encoding ASCII

Write-Host "  Generado: $START_API_BAT" -ForegroundColor Green
Write-Host ""

#-----------------------------------------------------------------------------
# Resumen
#-----------------------------------------------------------------------------
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  ¡Instalación completada!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "  1. Configure la base de datos SQL Server:"
Write-Host "     sqlcmd -S localhost -E -i `"$REPO_ROOT\backend\01_DDL_SQLServer.sql`""
Write-Host ""
Write-Host "  2. Edite `backend/.env` con sus credenciales de SQL Server."
Write-Host ""
Write-Host "  3. Instale el backend como servicio de Windows con NSSM:"
Write-Host "     nssm install LessencePOSAPI `"$START_API_BAT`""
Write-Host "     nssm set LessencePOSAPI Directory `"$BACKEND_DIR`""
Write-Host "     nssm start LessencePOSAPI"
Write-Host ""
Write-Host "  4. Despliegue `frontend/dist/` en IIS como sitio web estático."
Write-Host "     Use el archivo `frontend/web.config` para proxy inverso a :8050."
Write-Host ""
Write-Host "  5. Acceso:"
Write-Host "     Frontend:  http://localhost/ (o http://<IP-servidor>/) "
Write-Host "     API Docs:  http://localhost:8050/docs"
Write-Host ""
Write-Host "Credenciales por defecto (tras ejecutar el DDL):" -ForegroundColor Yellow
Write-Host "  admin@lessence.com   / Admin123!   (ROLE_ADMIN)"
Write-Host "  caja1@lessence.com   / Admin123!   (ROLE_CAJERO)"
Write-Host ""
