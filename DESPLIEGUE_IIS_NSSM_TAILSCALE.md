#=============================================================================
# L'ESSENCE POS - Guía de Despliegue On-Premise (Windows Server + IIS + NSSM)
#=============================================================================
# Frontend: React + TypeScript + Tailwind (puerto 3050 -> IIS estático)
# Backend:  FastAPI + SQL Server (puerto 8050 -> NSSM servicio Windows)
# DB:       Microsoft SQL Server
#-----------------------------------------------------------------------------

===============================================================================
PRERREQUISITOS EN WINDOWS SERVER
===============================================================================

1. Microsoft SQL Server (Express, Standard o Enterprise)
   - Instalado y en ejecución
   - ODBC Driver 17 for SQL Server instalado
   - Base de datos LesserencePOSDB creada con el script:
     backend\01_DDL_SQLServer.sql

2. Python 3.10+ instalado en el servidor
   - Agregado al PATH del sistema

3. Node.js 18+ instalado (solo para build del frontend en máquina de desarrollo
   o en el servidor si se desea compilar localmente)

4. Roles de Windows Server:
   - IIS (Servicios de Información de Internet) con:
     * Desarrollo de aplicaciones > ASP.NET 4.8 (opcional)
     * Seguridad > Filtrado de solicitudes
     * Salud y diagnóstico > Registro de HTTP
     * Rendimiento > Compresión estática y dinámica
   - Módulo de reescritura de URL (URL Rewrite) para IIS
   - Módulo de proxy (Application Request Routing - ARR)

5. NSSM (Non-Sucking Service Manager)
   - Descargar desde https://nssm.cc/
   - Descomprimir en C:\tools\nssm o similar
   - Agregar al PATH del sistema

===============================================================================
PASO 1: PREPARAR LA BASE DE DATOS SQL SERVER
===============================================================================

Conéctese a SQL Server mediante SQL Server Management Studio (SSMS) o
sqlcmd y ejecute el script DDL:

    sqlcmd -S localhost -E -i "C:\perfumeria\backend\01_DDL_SQLServer.sql"

Esto creará:
  - Base de datos: LesserencePOSDB
  - Tablas: Usuarios, ConfiguracionEmpresa, Productos, Ventas, DetalleVentas, MovimientosCaja
  - Vista: vw_ResumenCaja
  - Datos seed: 2 usuarios (admin/cajero), configuración empresa, 8 perfumes

Verificar conexión ODBC:
    %windir%\syswow64\odbcad32.exe  (ODBC 32-bit)
    %windir%\system32\odbcad32.exe   (ODBC 64-bit)
    Agregar DSN de usuario o sistema: "ODBC Driver 17 for SQL Server"

===============================================================================
PASO 2: DESPLEGAR EL BACKEND FASTAPI (PUERTO 8050)
===============================================================================

2.1 Publicar archivos del backend en el servidor

    Copiar la carpeta C:\perfumeria\backend a:
      C:\inetpub\lessence-pos\backend

2.2 Crear entorno virtual e instalar dependencias

    cd C:\inetpub\lessence-pos\backend
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt

2.3 Configurar variables de entorno (.env)

    Copiar .env.example a .env y editar:

    DATABASE_URL=mssql+pyodbc://localhost/LesserencePOSDB?driver=ODBC+Driver+17+for+SQL+Server&Trusted_Connection=yes

    Si usa autenticación SQL Server (usuario/password):
    DATABASE_URL=mssql+pyodbc://sa:TuPasswordSegura!@localhost/LesserencePOSDB?driver=ODBC+Driver+17+for+SQL+Server

    SECRET_KEY=cambiar_por_clave_secreta_larga_aleatoria
    ACCESS_TOKEN_EXPIRE_MINUTES=480
    CORS_ORIGINS=http://localhost:3050,http://127.0.0.1:3050,https://tu-dominio.com
    API_PORT=8050
    DEBUG=False

2.4 Probar el backend manualmente

    uvicorn app.main:app --host 0.0.0.0 --port 8050

    Debería responder en:
      http://localhost:8050/docs
      http://localhost:8050/health

===============================================================================
PASO 3: INSTALAR FASTAPI COMO SERVICIO WINDOWS CON NSSM
===============================================================================

3.1 Crear un script de arranque (start_api.bat)

    Crear archivo C:\inetpub\lessence-pos\backend\start_api.bat:

    @echo off
    cd /d "C:\inetpub\lessence-pos\backend"
    call venv\Scripts\Activate.bat
    uvicorn app.main:app --host 0.0.0.0 --port 8050

3.2 Instalar servicio con NSSM

    nssm install LessencePOSAPI "C:\inetpub\lessence-pos\backend\start_api.bat"

3.3 Configurar el servicio

    nssm set LessencePOSAPI Directory "C:\inetpub\lessence-pos\backend"
    nssm set LessencePOSAPI Description "L'Essence POS - API FastAPI en puerto 8050"
    nssm set LessencePOSAPI Start SERVICE_AUTO_START
    nssm set LessencePOSAPI RestartDelay 5000
    nssm set LessencePOSAPI ThrottleReset 10000

3.3 Iniciar el servicio

    nssm start LessencePOSAPI

    Verificar:
    nssm status LessencePOSAPI
    sc query LessencePOSAPI

    El API estará disponible en http://localhost:8050

===============================================================================
PASO 4: BUILD Y DESPLEGUE DEL FRONTEND REACT (PUERTO 3050 -> IIS)
===============================================================================

4.1 Build de producción (en máquina de desarrollo o servidor)

    cd C:\perfumeria\frontend
    npm install
    npm run build

    Esto genera la carpeta dist/ con:
      - index.html
      - assets/*.js, *.css

4.2 Copiar archivos estáticos a IIS

    Crear sitio web en IIS:
      - Nombre del sitio: L'Essence POS
      - Ruta física: C:\inetpub\lessence-pos\frontend (o donde copie dist/)
      - Puerto: 80 (o 443 con SSL)
      - Nombre de host: pos.lessence.local (o IP del servidor)

    Copiar el contenido de dist/ a la ruta física del sitio IIS.
    Copiar también el archivo web.config proporcionado en esta guía.

4.3 Configurar IIS para SPA (React Router)

    El archivo web.config incluye:
    - Reescritura de URL para /api/ -> proxy a localhost:8050
    - Fallback para rutas de React Router (devuelve index.html)
    - MIME types para JS, CSS, SVG
    - Headers de seguridad y CORS

    Habilitar "Application Request Routing" y "URL Rewrite" en IIS para
    que el proxy funcione.

4.4 Verificar el frontend

    http://localhost/          (o http://<IP-servidor>/)
    Debería cargar la aplicación L'Essence POS.

===============================================================================
PASO 5: CONFIGURAR FIREWALL DE WINDOWS
===============================================================================

    New-NetFirewallRule -DisplayName "L'Essence POS API" -Direction Inbound -Protocol TCP -LocalPort 8050 -Action Allow
    New-NetFirewallRule -DisplayName "L'Essence POS Web" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
    New-NetFirewallRule -DisplayName "L'Essence POS Web SSL" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow

===============================================================================
PASO 6: CONFIGURAR TAILSCALE PARA DISPOSITIVOS MÓVILES
===============================================================================

6.1 Instalar Tailscale en el servidor Windows

    Descargar e instalar desde https://tailscale.com/download
    O mediante PowerShell (administrador):

    iex (iwr -useb https://tailscale.com/install.ps1)

6.2 Autenticar Tailscale

    tailscale up

    Siga el enlace en el navegador para autenticar con su cuenta de Tailscale.

6.3 Obtener la IP de Tailscale del servidor

    tailscale ip

    Ejemplo: 100.64.0.55

6.4 Acceder desde dispositivos móviles

    Instalar Tailscale en el dispositivo móvil (iOS/Android)
    Autenticar con la misma cuenta

    Acceder a:
      http://<IP-tailscale>:80/     (Frontend vía IIS)
      http://<IP-tailscale>:8050/docs  (Documentación API directa)

6.5 Configurar CORS para Tailscale (opcional)

    En .env del backend agregar las IPs de Tailscale:
    CORS_ORIGINS=http://localhost:3050,http://127.0.0.1:3050,http://100.64.0.55,http://<otra-ip-tailscale>

    Reiniciar el servicio:
    nssm restart LessencePOSAPI

===============================================================================
PASO 7: SSL / HTTPS (RECOMENDADO PARA PRODUCCIÓN)
===============================================================================

7.1 Obtener certificado SSL

    Opción A: Let's Encrypt mediante Certbot para IIS
    Opción B: Certificado autofirmado (interno)
    Opción C: Certificado de la CA corporativa

7.2 Vincular en IIS

    - Sitio web L'Essence POS > Enlaces > Agregar
    - Tipo: https
    - Puerto: 443
    - Certificado: seleccionar el certificado instalado

7.3 Forzar redirección HTTP -> HTTPS

    Agregar regla de reescritura en web.config o usar la característica
    "Redirección de URL" de IIS.

7.4 Actualizar CORS en .env

    CORS_ORIGINS=https://pos.lessence.com,https://<ip-tailscale>

===============================================================================
PASO 8: USUARIOS POR DEFECTO Y CREDENCIALES
===============================================================================

Tras ejecutar el script DDL, los usuarios creados son:

  Usuario: ana@lessence.com     | Rol: ROLE_ADMIN   | Contraseña: Admin123!
  Usuario: caja1@lessence.com   | Rol: ROLE_CAJERO  | Contraseña: Admin123!

IMPORTANTE: Cambiar las contraseñas en producción tras el primer inicio.

===============================================================================
RESUMEN DE PUERTOS Y ACCESO
===============================================================================

  Servicio              Puerto   Acceso Local          Acceso Tailscale
  --------------------- -------- --------------------- ----------------------
  Frontend (IIS)        80/443   http://servidor/      http://<ip-tailscale>/
  Backend (FastAPI)     8050     http://localhost:8050 http://<ip-tailscale>:8050
  Documentación API             http://localhost:8050/docs http://<ip-tailscale>:8050/docs
  SQL Server            1433     localhost:1433        (no exponer directamente)

===============================================================================
COMANDOS ÚTILES DE MANTENIMIENTO
===============================================================================

    # Estado del servicio FastAPI
    nssm status LessencePOSAPI

    # Reiniciar API tras cambios
    nssm restart LessencePOSAPI

    # Ver logs del servicio
    nssm lessenceposapi logs  (si está configurado)

    # Reciclar IIS
    iisreset

    # Verificar puertos en uso
    netstat -ano | findstr :8050
    netstat -ano | findstr :80

===============================================================================
FIN DE LA GUÍA
===============================================================================
