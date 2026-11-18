/********************************************************************************
 * NURFA ESSENCI PERFUMERÍA - Sistema Integral POS
 * Base de Datos: Microsoft SQL Server
 * Script DDL - Fase 1: Estructura inicial
 ********************************************************************************/

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'LesserencePOSDB')
BEGIN
    CREATE DATABASE LesserencePOSDB;
END
GO

USE LesserencePOSDB;
GO

/********************************************************************************
 * TABLA: Usuarios
 * Autenticación y control de accesos RBAC (JWT)
 ********************************************************************************/
IF OBJECT_ID('dbo.Usuarios', 'U') IS NOT NULL DROP TABLE dbo.Usuarios;
GO

CREATE TABLE dbo.Usuarios (
    Id INT IDENTITY(1,1) NOT NULL,
    Nombre NVARCHAR(150) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    PasswordHash NVARCHAR(500) NOT NULL,
    Rol NVARCHAR(50) NOT NULL DEFAULT 'ROLE_CAJERO',
    Permisos NVARCHAR(MAX) NULL,
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    FechaActualizacion DATETIME NULL,
    CONSTRAINT PK_Usuarios PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT UQ_Usuarios_Email UNIQUE (Email),
    CONSTRAINT CHK_Usuarios_Rol CHECK (Rol IN ('ROLE_ADMIN', 'ROLE_CAJERO'))
);
GO

CREATE NONCLUSTERED INDEX IX_Usuarios_Rol ON dbo.Usuarios (Rol);
CREATE NONCLUSTERED INDEX IX_Usuarios_Activo ON dbo.Usuarios (Activo);
GO

/********************************************************************************
 * TABLA: ConfiguracionEmpresa
 * Datos fiscales y de facturación (RNC, NCF, secuencia, etc.)
 ********************************************************************************/
IF OBJECT_ID('dbo.ConfiguracionEmpresa', 'U') IS NOT NULL DROP TABLE dbo.ConfiguracionEmpresa;
GO

CREATE TABLE dbo.ConfiguracionEmpresa (
    Id INT IDENTITY(1,1) NOT NULL,
    NombreComercial NVARCHAR(200) NOT NULL DEFAULT 'NURFA ESSENCI PERFUMERÍA',
    RazonSocial NVARCHAR(200) NOT NULL DEFAULT 'INVERSIONES AROMAS DEL CARIBE SRL',
    RNC NVARCHAR(50) NOT NULL DEFAULT '1-31-84920-5',
    Direccion NVARCHAR(500) NULL,
    Ciudad NVARCHAR(100) NULL,
    Telefono NVARCHAR(50) NULL,
    Email NVARCHAR(255) NULL,
    SitioWeb NVARCHAR(255) NULL,
    RedesSociales NVARCHAR(500) NULL,
    LogoUrl NVARCHAR(1000) NULL DEFAULT '/logo.jpeg',
    NCFSerie NVARCHAR(20) NOT NULL DEFAULT 'B02',
    NCFSecuenciaActual INT NOT NULL DEFAULT 0,
    ITBISPorcentaje DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    MonedaSimbolo NVARCHAR(10) NOT NULL DEFAULT '$',
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    FechaActualizacion DATETIME NULL,
    CONSTRAINT PK_ConfiguracionEmpresa PRIMARY KEY CLUSTERED (Id)
);
GO

/********************************************************************************
 * TABLA: Productos
 * Catálogo de fragancias con control de stock y costos
 ********************************************************************************/
IF OBJECT_ID('dbo.Productos', 'U') IS NOT NULL DROP TABLE dbo.Productos;
GO

CREATE TABLE dbo.Productos (
    Id INT IDENTITY(1,1) NOT NULL,
    SKU NVARCHAR(50) NOT NULL,
    Nombre NVARCHAR(200) NOT NULL,
    Descripcion NVARCHAR(MAX) NULL,
    Categoria NVARCHAR(50) NOT NULL DEFAULT 'Damas',
    Costo DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    PorcentajeGanancia DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    PrecioVenta DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    StockActual INT NOT NULL DEFAULT 0,
    StockMinimo INT NOT NULL DEFAULT 4,
    ImagenesUrls NVARCHAR(1000) NULL,
    Dicans BIT NOT NULL DEFAULT 0,
    Mililitros INT NOT NULL DEFAULT 0,
    MililitrosDisponibles INT NOT NULL DEFAULT 0,
    PrecioPorMl DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    FechaActualizacion DATETIME NULL,
    CONSTRAINT PK_Productos PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT UQ_Productos_SKU UNIQUE (SKU),
    CONSTRAINT CHK_Productos_Stock CHECK (StockActual >= 0),
    CONSTRAINT CHK_Productos_Precios CHECK (PrecioVenta >= 0 AND Costo >= 0)
);
GO

CREATE NONCLUSTERED INDEX IX_Productos_Categoria ON dbo.Productos (Categoria);
CREATE NONCLUSTERED INDEX IX_Productos_Activo ON dbo.Productos (Activo);
CREATE NONCLUSTERED INDEX IX_Productos_StockBajo ON dbo.Productos (StockActual) WHERE StockActual <= StockMinimo;
GO

/********************************************************************************
 * TABLA: ConfiguracionFactura
 * Diseño editable del ticket (textos, campos visibles y ancho)
 ********************************************************************************/
IF OBJECT_ID('dbo.ConfiguracionFactura', 'U') IS NOT NULL DROP TABLE dbo.ConfiguracionFactura;
GO

CREATE TABLE dbo.ConfiguracionFactura (
    Id INT IDENTITY(1,1) NOT NULL,
    TituloTicket NVARCHAR(200) NOT NULL DEFAULT 'NURFA ESSENCI PERFUMERÍA',
    MensajeAgradecimiento NVARCHAR(500) NOT NULL DEFAULT '¡GRACIAS POR PREFERIRNOS!',
    MensajeGarantia NVARCHAR(500) NOT NULL DEFAULT 'Conserve este ticket para fines de garantía.',
    MensajePolitica NVARCHAR(500) NOT NULL DEFAULT 'No se aceptan devoluciones en perfumes destapados o sin su celofán original.',
    MensajePie NVARCHAR(500) NULL,
    RedSocial NVARCHAR(100) NULL DEFAULT '@nurfaessenciperfumeria',
    PrefijoFactura NVARCHAR(20) NOT NULL DEFAULT 'FAC',
    AnchoTicketMm INT NOT NULL DEFAULT 80,
    MostrarLogo BIT NOT NULL DEFAULT 1,
    MostrarSKU BIT NOT NULL DEFAULT 1,
    MostrarCajero BIT NOT NULL DEFAULT 1,
    MostrarCliente BIT NOT NULL DEFAULT 1,
    MostrarNCF BIT NOT NULL DEFAULT 1,
    MostrarCodigoBarras BIT NOT NULL DEFAULT 1,
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    FechaActualizacion DATETIME NULL,
    CONSTRAINT PK_ConfiguracionFactura PRIMARY KEY CLUSTERED (Id)
);
GO

/********************************************************************************
 * TABLA: Ventas
 * Cabecera de facturas / tickets de venta
 ********************************************************************************/
IF OBJECT_ID('dbo.Ventas', 'U') IS NOT NULL DROP TABLE dbo.Ventas;
GO

CREATE TABLE dbo.Ventas (
    Id INT IDENTITY(1,1) NOT NULL,
    NumeroFactura NVARCHAR(50) NOT NULL,
    NCF NVARCHAR(50) NULL,
    FechaVenta DATETIME NOT NULL DEFAULT GETDATE(),
    IdUsuario INT NOT NULL,
    Cliente NVARCHAR(200) NOT NULL DEFAULT 'CONSUMIDOR FINAL',
    MetodoPago NVARCHAR(50) NOT NULL DEFAULT 'Efectivo',
    Subtotal DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    DescuentoPorcentaje DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    DescuentoMonto DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    BaseImponible DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    ITBIS DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    Total DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    EfectivoRecibido DECIMAL(18,2) NULL,
    Cambio DECIMAL(18,2) NULL,
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_Ventas PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT UQ_Ventas_NumeroFactura UNIQUE (NumeroFactura),
    CONSTRAINT FK_Ventas_Usuario FOREIGN KEY (IdUsuario) REFERENCES dbo.Usuarios(Id),
    CONSTRAINT CHK_Ventas_MetodoPago CHECK (MetodoPago IN ('Efectivo', 'Tarjeta', 'Transferencia')),
    CONSTRAINT CHK_Ventas_Totales CHECK (Total >= 0)
);
GO

CREATE NONCLUSTERED INDEX IX_Ventas_Fecha ON dbo.Ventas (FechaVenta);
CREATE NONCLUSTERED INDEX IX_Ventas_Usuario ON dbo.Ventas (IdUsuario);
CREATE NONCLUSTERED INDEX IX_Ventas_MetodoPago ON dbo.Ventas (MetodoPago);
CREATE NONCLUSTERED INDEX IX_Ventas_NumeroFactura ON dbo.Ventas (NumeroFactura);
GO

/********************************************************************************
 * TABLA: DetalleVentas
 * Líneas de cada venta (productos, cantidades, precios)
 ********************************************************************************/
IF OBJECT_ID('dbo.DetalleVentas', 'U') IS NOT NULL DROP TABLE dbo.DetalleVentas;
GO

CREATE TABLE dbo.DetalleVentas (
    Id INT IDENTITY(1,1) NOT NULL,
    IdVenta INT NOT NULL,
    IdProducto INT NOT NULL,
    SKU NVARCHAR(50) NULL,
    NombreProducto NVARCHAR(200) NULL,
    Cantidad INT NOT NULL DEFAULT 1,
    PrecioUnitario DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    Importe DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    EsDecant BIT NOT NULL DEFAULT 0,
    CONSTRAINT PK_DetalleVentas PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_DetalleVentas_Venta FOREIGN KEY (IdVenta) REFERENCES dbo.Ventas(Id) ON DELETE CASCADE,
    CONSTRAINT FK_DetalleVentas_Producto FOREIGN KEY (IdProducto) REFERENCES dbo.Productos(Id),
    CONSTRAINT CHK_DetalleVentas_Cantidad CHECK (Cantidad > 0),
    CONSTRAINT CHK_DetalleVentas_Importe CHECK (Importe >= 0)
);
GO

CREATE NONCLUSTERED INDEX IX_DetalleVentas_Venta ON dbo.DetalleVentas (IdVenta);
CREATE NONCLUSTERED INDEX IX_DetalleVentas_Producto ON dbo.DetalleVentas (IdProducto);
GO

/********************************************************************************
 * TABLA: MovimientosCaja
 * Registro de entradas/salidas de efectivo y arqueo de turno
 ********************************************************************************/
IF OBJECT_ID('dbo.MovimientosCaja', 'U') IS NOT NULL DROP TABLE dbo.MovimientosCaja;
GO

CREATE TABLE dbo.MovimientosCaja (
    Id INT IDENTITY(1,1) NOT NULL,
    Tipo NVARCHAR(50) NOT NULL,
    Concepto NVARCHAR(500) NOT NULL,
    MetodoPago NVARCHAR(50) NULL,
    Monto DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    MontoContado DECIMAL(18,2) NULL,
    Diferencia DECIMAL(18,2) NULL,
    IdUsuario INT NOT NULL,
    IdVenta INT NULL,
    FechaMovimiento DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_MovimientosCaja PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_MovimientosCaja_Usuario FOREIGN KEY (IdUsuario) REFERENCES dbo.Usuarios(Id),
    CONSTRAINT FK_MovimientosCaja_Venta FOREIGN KEY (IdVenta) REFERENCES dbo.Ventas(Id),
    CONSTRAINT CHK_MovimientosCaja_Tipo CHECK (Tipo IN ('Apertura', 'Ingreso', 'Egreso', 'Venta', 'Cierre'))
);
GO

CREATE NONCLUSTERED INDEX IX_MovimientosCaja_Fecha ON dbo.MovimientosCaja (FechaMovimiento);
CREATE NONCLUSTERED INDEX IX_MovimientosCaja_Tipo ON dbo.MovimientosCaja (Tipo);
CREATE NONCLUSTERED INDEX IX_MovimientosCaja_Usuario ON dbo.MovimientosCaja (IdUsuario);
GO

/********************************************************************************
 * DATOS SEED INICIALES
 ********************************************************************************/

-- Usuario Administrador por defecto (contraseña: Admin123!)
INSERT INTO dbo.Usuarios (Nombre, Email, PasswordHash, Rol, Permisos, Activo)
VALUES 
    ('Administradora Nurfa', 'admin@nurfaessenci.com', '$2b$12$LQv3c1yqBWVHxEg0dY5kdOVwRpQy7y6R9f6n7s2k0j3f8h5a1m4e6', 'ROLE_ADMIN', 'pos.vender,pos.descuentos,inventario.ver,inventario.costos,inventario.editar,caja.movimientos,caja.apertura_cierre,contabilidad.ver,factura.editar,factura.configurar,usuarios.gestionar', 1),
    ('Cajero Nurfa', 'caja1@nurfaessenci.com', '$2b$12$LQv3c1yqBWVHxEg0dY5kdOVwRpQy7y6R9f6n7s2k0j3f8h5a1m4e6', 'ROLE_CAJERO', 'pos.vender,pos.descuentos,inventario.ver,caja.movimientos', 1);
GO

-- Configuración de empresa con datos fiscales del prototipo
INSERT INTO dbo.ConfiguracionEmpresa (
    NombreComercial, RazonSocial, RNC, Direccion, Ciudad, Telefono, Email,
    NCFSerie, NCFSecuenciaActual, ITBISPorcentaje, MonedaSimbolo, Activo
)
VALUES (
    'NURFA ESSENCI PERFUMERÍA',
    'NURFA ESSENCI SRL',
    '1-31-84920-5',
    'Av. Independencia #104, Local 2B',
    'San Pedro de Macorís',
    '(809) 529-4410',
    'contacto@nurfaessenci.com',
    'B02',
    0,
    18.00,
    '$',
    1
);
GO

INSERT INTO dbo.ConfiguracionFactura (
    TituloTicket, MensajeAgradecimiento, MensajeGarantia, MensajePolitica, MensajePie,
    RedSocial, PrefijoFactura, AnchoTicketMm, MostrarLogo, MostrarSKU, MostrarCajero,
    MostrarCliente, MostrarNCF, MostrarCodigoBarras, Activo
)
VALUES (
    'NURFA ESSENCI PERFUMERÍA',
    '¡GRACIAS POR PREFERIRNOS!',
    'Conserve este ticket para fines de garantía.',
    'No se aceptan devoluciones en perfumes destapados o sin su celofán original.',
    'Nurfa Essenci Perfumería · Elegancia que se recuerda',
    '@nurfaessenciperfumeria',
    'FAC',
    80,
    1, 1, 1, 1, 1, 1, 1
);
GO

-- Catálogo inicial de perfumes (mismo que el prototipo HTML)
INSERT INTO dbo.Productos (SKU, Nombre, Descripcion, Categoria, Costo, PrecioVenta, StockActual, StockMinimo, Activo)
VALUES 
    ('PRF-001', 'Chanel N°5 Eau de Parfum 100ml', 'Clásico floral aldehídico con notas de rosa de mayo, jazmín, ylang-ylang y vainilla bourbon.', 'Damas', 95.00, 165.00, 14, 4, 1),
    ('PRF-002', 'Dior Sauvage Elixir 60ml', 'Fragancia concentrada con notas especiadas de canela, nuez moscada, lavanda y sándalo.', 'Caballeros', 88.00, 155.00, 9, 4, 1),
    ('PRF-003', 'Lattafa Khamrah 100ml', 'Perfume árabe dulce y especiado con acordes de dátiles, praliné, canela y haba tonka.', 'Nicho', 28.00, 65.00, 22, 4, 1),
    ('PRF-004', 'Carolina Herrera Good Girl 80ml', 'Aroma sensual de almendra, café, nardos, jazmín sambac y cacao tostado.', 'Damas', 72.00, 130.00, 3, 4, 1),
    ('PRF-005', 'Bleu de Chanel Parfum 100ml', 'Amaderado aromático intenso con frescura cítrica, cedro de Nueva Caledonia y sándalo.', 'Caballeros', 92.00, 160.00, 11, 4, 1),
    ('PRF-006', 'CK One Eau de Toilette 200ml', 'Fresco cítrico verde con bergamota, té verde, papaya y almizcle limpio para uso diario.', 'Unisex', 32.00, 68.00, 18, 4, 1),
    ('PRF-007', 'YSL Libre Intense 90ml', 'Fusión floral cálida de lavanda francesa, flor de azahar, orquídea y vainilla de Madagascar.', 'Damas', 80.00, 145.00, 2, 4, 1),
    ('PRF-008', 'Creed Aventus 100ml', 'Chipre frutal de lujo con piña, bergamota, abedul ahumado, musgo de roble y ámbar gris.', 'Nicho', 210.00, 340.00, 5, 4, 1);
GO

PRINT 'Base de datos LesserencePOSDB creada exitosamente con tablas y datos seed.';
GO

/********************************************************************************
 * VISTA: Resumen de Caja por Turno
 * Útil para reportes de arqueo
 ********************************************************************************/
IF OBJECT_ID('dbo.vw_ResumenCaja', 'V') IS NOT NULL DROP VIEW dbo.vw_ResumenCaja;
GO

CREATE VIEW dbo.vw_ResumenCaja AS
SELECT 
    CAST(FechaMovimiento AS DATE) AS Fecha,
    SUM(CASE WHEN Tipo = 'Apertura' THEN Monto ELSE 0 END) AS FondoInicial,
    SUM(CASE WHEN Tipo = 'Venta' AND MetodoPago = 'Efectivo' THEN Monto ELSE 0 END) AS VentasEfectivo,
    SUM(CASE WHEN Tipo = 'Venta' AND MetodoPago <> 'Efectivo' THEN Monto ELSE 0 END) AS VentasNoEfectivo,
    SUM(CASE WHEN Tipo = 'Ingreso' THEN Monto ELSE 0 END) AS IngresosExtra,
    SUM(CASE WHEN Tipo = 'Egreso' THEN Monto ELSE 0 END) AS EgresosExtra,
    SUM(CASE 
        WHEN Tipo = 'Apertura' THEN Monto 
        WHEN Tipo = 'Venta' AND MetodoPago = 'Efectivo' THEN Monto 
        WHEN Tipo = 'Ingreso' THEN Monto 
        WHEN Tipo = 'Egreso' THEN -Monto 
        ELSE 0 
    END) AS EfectivoEsperado
FROM dbo.MovimientosCaja
GROUP BY CAST(FechaMovimiento AS DATE);
GO

PRINT 'Vista vw_ResumenCaja creada.';
GO
