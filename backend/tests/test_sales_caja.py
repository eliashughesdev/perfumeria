"""Pruebas del flujo de Ventas y Control de Caja."""

import pytest


class TestAperturaCaja:
    def test_apertura_caja_exitosa(self, client, admin_token):
        response = client.post(
            "/api/caja/apertura",
            params={"monto": 150.00},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["Tipo"] == "Apertura"
        assert float(data["Monto"]) == 150.00

    def test_apertura_caja_duplicada_mismo_dia(self, client, admin_token):
        client.post(
            "/api/caja/apertura",
            params={"monto": 150.00},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        response = client.post(
            "/api/caja/apertura",
            params={"monto": 100.00},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 400


class TestRegistroVenta:
    def test_venta_efectivo_con_descuento_e_itbis(
        self, client, admin_token, config_empresa, db_session
    ):
        from app.models import Producto

        producto = Producto(
            SKU="VENTA-001",
            Nombre="Perfume Venta Test",
            Categoria="Damas",
            Costo=40.00,
            PrecioVenta=100.00,
            StockActual=10,
            Activo=True,
        )
        db_session.add(producto)
        db_session.commit()

        # Apertura de caja previa
        client.post(
            "/api/caja/apertura",
            params={"monto": 150.00},
            headers={"Authorization": f"Bearer {admin_token}"},
        )

        # Subtotal: 100.00 * 2 = 200.00
        # Descuento 10%: 20.00
        # Base imponible: 180.00
        # ITBIS 18%: 32.40
        # Total: 212.40
        response = client.post(
            "/api/sales",
            json={
                "Cliente": "Cliente Test",
                "MetodoPago": "Efectivo",
                "DescuentoPorcentaje": 10.0,
                "EfectivoRecibido": 250.00,
                "Detalles": [
                    {
                        "IdProducto": producto.Id,
                        "Cantidad": 2,
                        "PrecioUnitario": 100.00,
                    }
                ],
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201, f"Error: {response.text}"
        data = response.json()
        assert data["NumeroFactura"].startswith("FAC-")
        assert data["Subtotal"] == "200.00" or float(data["Subtotal"]) == 200.00
        assert data["DescuentoMonto"] == "20.00" or float(data["DescuentoMonto"]) == 20.00
        assert data["BaseImponible"] == "180.00" or float(data["BaseImponible"]) == 180.00
        assert abs(float(data["ITBIS"]) - 32.40) < 0.01
        assert abs(float(data["Total"]) - 212.40) < 0.01
        assert data["EfectivoRecibido"] == 250.00 or float(data["EfectivoRecibido"]) == 250.00
        assert abs(float(data["Cambio"]) - 37.60) < 0.01

    def test_venta_descuenta_stock(self, client, admin_token, config_empresa, db_session):
        from app.models import Producto
        from sqlalchemy import select

        producto = Producto(
            SKU="STOCK-001",
            Nombre="Producto Stock Test",
            Categoria="Damas",
            Costo=30.00,
            PrecioVenta=60.00,
            StockActual=5,
            Activo=True,
        )
        db_session.add(producto)
        db_session.commit()
        db_session.refresh(producto)

        client.post(
            "/api/caja/apertura",
            params={"monto": 150.00},
            headers={"Authorization": f"Bearer {admin_token}"},
        )

        client.post(
            "/api/sales",
            json={
                "Cliente": "Consumidor Final",
                "MetodoPago": "Efectivo",
                "DescuentoPorcentaje": 0.0,
                "EfectivoRecibido": 100.00,
                "Detalles": [
                    {
                        "IdProducto": producto.Id,
                        "Cantidad": 3,
                        "PrecioUnitario": 60.00,
                    }
                ],
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )

        # Verificar que el stock se descontó
        stmt = select(Producto).where(Producto.Id == producto.Id)
        result = db_session.execute(stmt).scalar_one()
        assert result.StockActual == 2

    def test_venta_stock_insuficiente(self, client, admin_token, config_empresa, db_session):
        from app.models import Producto

        producto = Producto(
            SKU="LOW-001",
            Nombre="Producto Stock Bajo",
            Categoria="Damas",
            Costo=10.00,
            PrecioVenta=20.00,
            StockActual=1,
            Activo=True,
        )
        db_session.add(producto)
        db_session.commit()

        client.post(
            "/api/caja/apertura",
            params={"monto": 150.00},
            headers={"Authorization": f"Bearer {admin_token}"},
        )

        response = client.post(
            "/api/sales",
            json={
                "Cliente": "Consumidor Final",
                "MetodoPago": "Efectivo",
                "DescuentoPorcentaje": 0.0,
                "Detalles": [
                    {
                        "IdProducto": producto.Id,
                        "Cantidad": 5,
                        "PrecioUnitario": 20.00,
                    }
                ],
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 400
        assert "insuficiente" in response.json()["detail"].lower()

    def test_venta_producto_no_existente(self, client, admin_token, config_empresa):
        client.post(
            "/api/caja/apertura",
            params={"monto": 150.00},
            headers={"Authorization": f"Bearer {admin_token}"},
        )

        response = client.post(
            "/api/sales",
            json={
                "Cliente": "Consumidor Final",
                "MetodoPago": "Efectivo",
                "DescuentoPorcentaje": 0.0,
                "Detalles": [
                    {
                        "IdProducto": 99999,
                        "Cantidad": 1,
                        "PrecioUnitario": 20.00,
                    }
                ],
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 404


class TestMovimientoCajaAutomatico:
    def test_venta_registra_movimiento_caja(self, client, admin_token, config_empresa, db_session):
        from app.models import Producto, MovimientoCaja
        from sqlalchemy import select

        producto = Producto(
            SKU="MOV-001",
            Nombre="Producto Movimiento",
            Categoria="Damas",
            Costo=20.00,
            PrecioVenta=40.00,
            StockActual=5,
            Activo=True,
        )
        db_session.add(producto)
        db_session.commit()

        client.post(
            "/api/caja/apertura",
            params={"monto": 150.00},
            headers={"Authorization": f"Bearer {admin_token}"},
        )

        client.post(
            "/api/sales",
            json={
                "Cliente": "Consumidor Final",
                "MetodoPago": "Efectivo",
                "DescuentoPorcentaje": 0.0,
                "Detalles": [
                    {
                        "IdProducto": producto.Id,
                        "Cantidad": 1,
                        "PrecioUnitario": 40.00,
                    }
                ],
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )

        stmt = select(MovimientoCaja).where(MovimientoCaja.Tipo == "Venta")
        movimientos = db_session.execute(stmt).scalars().all()
        # Monto del movimiento = Total de venta (40 + 7.20 ITBIS = 47.20)
        assert len(movimientos) >= 1
        assert abs(float(movimientos[-1].Monto) - 47.20) < 0.01

    def test_venta_tarjeta_no_registra_movimiento_efectivo(
        self, client, admin_token, config_empresa, db_session
    ):
        from app.models import Producto, MovimientoCaja
        from sqlalchemy import select

        producto = Producto(
            SKU="MOV-002",
            Nombre="Producto Tarjeta",
            Categoria="Damas",
            Costo=20.00,
            PrecioVenta=40.00,
            StockActual=5,
            Activo=True,
        )
        db_session.add(producto)
        db_session.commit()

        client.post(
            "/api/caja/apertura",
            params={"monto": 150.00},
            headers={"Authorization": f"Bearer {admin_token}"},
        )

        client.post(
            "/api/sales",
            json={
                "Cliente": "Consumidor Final",
                "MetodoPago": "Tarjeta",
                "DescuentoPorcentaje": 0.0,
                "Detalles": [
                    {
                        "IdProducto": producto.Id,
                        "Cantidad": 1,
                        "PrecioUnitario": 40.00,
                    }
                ],
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )

        stmt = select(MovimientoCaja).where(
            MovimientoCaja.Tipo == "Venta",
            MovimientoCaja.MetodoPago == "Efectivo",
        )
        movimientos_efectivo = db_session.execute(stmt).scalars().all()
        assert len(movimientos_efectivo) == 0
