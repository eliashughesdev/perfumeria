# L'ESSENCE POS - Sistema Integral para Perfumería
# Arquitectura Full Stack On-Premise
#
# Frontend:  React + TypeScript + Tailwind CSS (puerto 3050)
# Backend:   Python FastAPI + SQL Server (puerto 8050)
# Despliegue: IIS (estático React + proxy inverso) + NSSM (servicio FastAPI)
# Acceso remoto: Tailscale para dispositivos móviles

===============================================================================
ESTRUCTURA DEL PROYECTO
===============================================================================

C:\perfumeria\
├── prototipo_ui_ux_sistema_pos_perfumer_a (1).html   # Prototipo original (referencia UI/UX)
├── 01_DDL_SQLServer.sql                              # (en backend/) Script DDL SQL Server
├── DESPLIEGUE_IIS_NSSM_TAILSCALE.md                  # Guía de despliegue Fase 4
├── backend\                                          # Fase 2 - FastAPI (puerto 8050)
│   ├── app\
│   │   ├── main.py                                   # Punto de entrada FastAPI
│   │   ├── config.py                                 # Configuración (.env)
│   │   ├── database.py                               # SQLAlchemy + pyodbc
│   │   ├── models.py                                 # Modelos ORM (6 tablas)
│   │   ├── schemas.py                                # Esquemas Pydantic v2
│   │   ├── security.py                               # JWT + bcrypt
│   │   ├── dependencies.py                           # Auth + RBAC dependencias
│   │   └── routers\
│   │       ├── auth.py                               # Login, refresh, logout, me
│   │       ├── products.py                           # CRUD productos (RBAC)
│   │       ├── sales.py                              # Ventas, ticket, stock
│   │       ├── caja.py                               # Apertura, arqueo, movimientos
│   │       └── users.py                              # Usuarios, matriz RBAC
│   ├── .env.example                                  # Variables de entorno backend
│   ├── requirements.txt                              # Dependencias Python
│   └── README.md                                     # Instrucciones backend
└── frontend\                                         # Fase 3 - React (puerto 3050)
    ├── src\
    │   ├── main.tsx                                  # Entry point
    │   ├── App.tsx                                   # Componente raíz + lógica negocio
    │   ├── index.css                                 # Tailwind + estilos custom
    │   ├── vite-env.d.ts                             # Tipos import.meta.env
    │   ├── types\index.ts                            # Tipos TypeScript
    │   ├── contexts\AuthContext.tsx                  # Contexto de autenticación JWT
    │   ├── services\api.ts                           # Servicios HTTP (axios)
    │   ├── utils\format.ts                           # Utilidades de formato
    │   ├── components\
    │   │   ├── layout\Header.tsx                     # Top bar + RBAC role switcher
    │   │   ├── layout\Sidebar.tsx                    # Navegación lateral
    │   │   ├── layout\Toast.tsx                      # Notificaciones toast
    │   │   ├── pos\ProductCatalog.tsx                # Catálogo con filtros
    │   │   ├── pos\CartPanel.tsx                     # Carrito + resumen
    │   │   ├── caja\CajaView.tsx                     # Control de caja y arqueo
    │   │   ├── inventario\InventarioView.tsx         # Tabla de inventario
    │   │   ├── inventario\ProductDetailModal.tsx     # Detalle producto (costo solo admin)
    │   │   ├── inventario\NewProductModal.tsx        # Nuevo producto con foto
    │   │   ├── checkout\CheckoutModal.tsx            # Cobro + métodos de pago + devuelta
    │   │   ├── invoice\InvoicePreviewModal.tsx       # Ticket térmico 80mm imprimible
    │   │   ├── contabilidad\ContabilidadView.tsx     # KPIs financieros (solo admin)
    │   │   └── usuarios\UsuariosView.tsx             # Gestión usuarios + matriz RBAC
    ├── web.config                                    # IIS: proxy inverso + SPA fallback
    ├── tailwind.config.js                            # Paleta plum/gold corporativa
    ├── vite.config.ts                                # Vite + proxy /api -> 8050
    ├── package.json                                  # Dependencias npm
    └── .env.example                                  # Variables de entorno frontend

===============================================================================
MÓDULOS FUNCIONALES IMPLEMENTADOS
===============================================================================

1. PUNTO DE VENTA (POS)
   - Catálogo con filtros por categoría (Todos, Damas, Caballeros, Unisex, Nicho)
   - Búsqueda en tiempo real por nombre, SKU o descripción
   - Control de stock con alerta visual (stock <= 4 unidades)
   - Carrito dinámico con ajuste de cantidades
   - Descuento por porcentaje (0-50%) con ITBIS 18% automático
   - Métodos de pago: Efectivo, Tarjeta, Transferencia
   - Cálculo de devuelta para pagos en efectivo

2. TICKET TÉRMICO (80mm)
   - Área imprimible de 80mm con window.print()
   - Datos fiscales: RNC, NCF, secuencia de factura
   - Fecha, cajero, cliente, método de pago
   - Detalle de items con SKU y precio unitario
   - Totales: subtotal, descuento, ITBIS, total, recibido, cambio
   - Código de barras simulado (CSS repeating-linear-gradient)

3. CONTROL DE CAJA Y TURNOS (ARQUEO)
   - Fondo inicial de apertura
   - Ventas en efectivo vs tarjeta/transferencia
   - Efectivo esperado en gaveta
   - Registro de ingresos/egresos
   - Cierre de turno y arqueo

4. INVENTARIO DE FRAGANCIAS
   - CRUD completo de productos
   - Control de existencias con alertas de stock bajo
   - Costos visibles solo para rol Admin (RBAC)
   - Carga de fotografía del producto

5. USUARIOS Y SEGURIDAD RBAC
   - Autenticación JWT (access + refresh token)
   - Roles: ROLE_ADMIN y ROLE_CAJERO
   - Matriz de permisos estricta por módulo
   - Costos ocultos para cajeros
   - Módulos Contabilidad y Usuarios restringidos a Admin

===============================================================================
PALETA DE COLORES CORPORATIVA (Tailwind)
===============================================================================

  plum-950: #190822  (Fondo principal, header activo)
  plum-900: #271033  (Fondo secundario, botones primarios)
  plum-800: #3b1c4a  (Bordes, acentos oscuros)
  gold-400: #d4af37  (Acentos dorados, iconos activos)
  emerald:  estados de stock y caja (abierto, disponible)
  amber:    alertas de stock bajo

===============================================================================
COMANDOS DE INICIO RÁPIDO (DESARROLLO)
===============================================================================

Backend (puerto 8050):
  cd backend
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  pip install -r requirements.txt
  Copy-Item .env.example .env
  uvicorn app.main:app --host 0.0.0.0 --port 8050 --reload

Frontend (puerto 3050):
  cd frontend
  npm install
  Copy-Item .env.example .env
  npm run dev

Acceso: http://localhost:3050
API Docs: http://localhost:8050/docs

===============================================================================
CREDENCIALES POR DEFECTO (tras ejecutar DDL)
===============================================================================

  admin@lessence.com   / Admin123!   (ROLE_ADMIN)
  cajero@lessence.com  / Admin123!   (ROLE_CAJERO)

===============================================================================
