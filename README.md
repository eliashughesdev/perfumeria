# NURFA ESSENCIAL POS - Sistema Integral para Perfumería

Arquitectura Full Stack On-Premise para punto de venta de perfumería.

## Arquitectura

| Componente | Tecnología | Puerto |
|------------|------------|--------|
| Frontend | React + TypeScript + Tailwind CSS | 3050 (dev) / 80 (IIS) |
| Backend | Python FastAPI + SQL Server | 8050 |
| Base de Datos | Microsoft SQL Server | 1433 |
| Despliegue | IIS (estático + proxy inverso) + NSSM | - |
| Acceso remoto | Tailscale | - |

## Estructura del Repositorio

```
C:\perfumeria\
├── .gitignore
├── README.md
├── scripts\
│   └── install_server.ps1          # Script de despliegue automático
├── docs\
│   └── prototipo_ui_ux_sistema_pos_perfumer_a.html   # Prototipo original (referencia UI/UX)
├── backend\                        # Fase 2 - FastAPI (puerto 8050)
│   ├── 01_DDL_SQLServer.sql        # Fase 1 - Script DDL SQL Server
│   ├── .env.example                # Variables de entorno backend
│   ├── requirements.txt            # Dependencias Python
│   ├── README.md                   # Instrucciones backend
│   ├── app\
│   │   ├── main.py                 # Punto de entrada FastAPI
│   │   ├── config.py               # Configuración (.env)
│   │   ├── database.py             # SQLAlchemy + pyodbc
│   │   ├── models.py               # Modelos ORM (6 tablas)
│   │   ├── schemas.py              # Esquemas Pydantic v2
│   │   ├── security.py             # JWT + bcrypt
│   │   ├── dependencies.py         # Auth + RBAC dependencias
│   │   └── routers\
│   │       ├── auth.py             # Login, refresh, logout, me
│   │       ├── products.py         # CRUD productos (RBAC)
│   │       ├── sales.py            # Ventas, ticket, stock
│   │       ├── caja.py             # Apertura, arqueo, movimientos
│   │       └── users.py            # Usuarios, matriz RBAC
│   └── tests\                      # Suite de pruebas backend (pytest)
│       ├── conftest.py
│       ├── test_auth_rbac.py
│       ├── test_products.py
│       └── test_sales_caja.py
└── frontend\                       # Fase 3 - React (puerto 3050)
    ├── .env.example                # Variables de entorno frontend
    ├── web.config                  # IIS: proxy inverso + SPA fallback
    ├── tailwind.config.js          # Paleta plum/gold corporativa
    ├── vite.config.ts              # Vite + proxy /api -> 8050
    ├── package.json                # Dependencias npm
    ├── src\
    │   ├── main.tsx                # Entry point
    │   ├── App.tsx                 # Componente raíz + lógica negocio
    │   ├── index.css               # Tailwind + estilos custom
    │   ├── vite-env.d.ts           # Tipos import.meta.env
    │   ├── types/index.ts          # Tipos TypeScript
    │   ├── contexts/AuthContext.tsx # Contexto de autenticación JWT
    │   ├── services/api.ts         # Servicios HTTP (axios)
    │   ├── utils/format.ts         # Utilidades de formato
    │   ├── components\             # Componentes React
    │   │   ├── layout\             # Header, Sidebar, Toast
    │   │   ├── pos\                # ProductCatalog, CartPanel
    │   │   ├── caja\               # CajaView
    │   │   ├── inventario\         # InventarioView, ProductDetailModal, NewProductModal
    │   │   ├── checkout\           # CheckoutModal
    │   │   ├── invoice\            # InvoicePreviewModal (ticket térmico 80mm)
    │   │   ├── contabilidad\       # ContabilidadView
    │   │   └── usuarios\           # UsuariosView
    │   └── __tests__\              # Suite de pruebas frontend (Vitest + RTL)
    │       ├── setup.ts
    │       ├── CartCalculations.test.tsx
    │       └── RBACVisibility.test.tsx
    └── dist\                       # Build de producción (generado)
```

## Módulos Funcionales

1. **Punto de Venta (POS)**: Catálogo con filtros por categoría, búsqueda en tiempo real, control de stock, carrito dinámico, descuentos, métodos de pago (Efectivo, Tarjeta, Transferencia) con cálculo de devuelta.
2. **Ticket Térmico (80mm)**: Área imprimible con datos fiscales (RNC, NCF, secuencia de factura, fecha, cajero, cliente, código de barras simulado) lista para `window.print()`.
3. **Control de Caja y Turnos (Arqueo)**: Fondo inicial, registro de ingresos/egresos, cálculo de efectivo esperado en gaveta.
4. **Inventario de Fragancias**: CRUD completo, control de existencias con alertas de stock bajo, costos visibles solo bajo rol Admin.
5. **Usuarios y Seguridad RBAC**: Autenticación JWT, roles `ROLE_ADMIN` y `ROLE_CAJERO` con matriz de permisos estricta.

## Despliegue Rápido (Servidor del Cliente)

### Opción A: Script Automático (Recomendado)

```powershell
# 1. Clonar el repositorio
git clone <url-del-repositorio> C:\perfumeria
cd C:\perfumeria

# 2. Ejecutar el instalador
.\scripts\install_server.ps1
```

El script verificará prerrequisitos, creará el entorno virtual, instalará dependencias, construirá el frontend y generará `start_api.bat`.

### Opción B: Despliegue Manual

```powershell
# Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
# Editar .env con credenciales SQL Server
uvicorn app.main:app --host 0.0.0.0 --port 8050

# Frontend
cd ../frontend
npm install
npm run build
# Desplegar dist/ en IIS
```

## Base de Datos

Ejecutar el script DDL en SQL Server antes de iniciar la aplicación:

```powershell
sqlcmd -S localhost -E -i "backend\01_DDL_SQLServer.sql"
```

## Pruebas

### Backend (pytest)
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pytest -v
```
Resultado esperado: **27/27 tests pasando**.

### Frontend (Vitest + React Testing Library)
```powershell
cd frontend
npm run test
```
Resultado esperado: **12/12 tests pasando**.

### Build de Producción
```powershell
cd frontend
npm run build
```
Genera `dist/` listo para IIS.

## Credenciales por Defecto

Tras ejecutar el script DDL, los usuarios creados son:

| Email | Rol | Contraseña |
|-------|-----|------------|
| admin@nurfaessencial.com | ROLE_ADMIN | Admin123! |
| caja1@nurfaessencial.com | ROLE_CAJERO | Admin123! |

**Importante:** Cambiar las contraseñas en producción tras el primer inicio.

## Guía de Despliegue Completo

Consultar `DESPLIEGUE_IIS_NSSM_TAILSCALE.md` para instrucciones detalladas de:
- IIS (servidor web estático + proxy inverso)
- NSSM (servicio Windows para FastAPI)
- Tailscale (acceso desde dispositivos móviles)
- SSL/HTTPS para producción

## Paleta de Colores Corporativa

| Color | Hex | Uso |
|-------|-----|-----|
| plum-950 | #190822 | Fondo principal, header activo |
| plum-900 | #271033 | Fondo secundario, botones primarios |
| plum-800 | #3b1c4a | Bordes, acentos oscuros |
| gold-400 | #d4af37 | Acentos dorados, iconos activos |
| emerald | #10b981 | Estados de stock y caja (abierto, disponible) |
| amber | #f59e0b | Alertas de stock bajo |
