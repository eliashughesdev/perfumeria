"""Pruebas del flujo de decants (venta por mililitros)."""

import pytest


def _crear_producto_decant(db_session, **overrides):
    from app.models import Producto

    datos = dict(
        SKU="DEC-001",
        Nombre="Perfume Decant Test",
        Categoria="Nicho",
        Costo=40.00,
        PrecioVenta=100.00,
        StockActual=3,
        Mililitros=100,
        MililitrosDisponibles=0,
        PrecioPorMl=1.50,
        Dicans=True,
        Activo=True,
    )
    datos.update(overrides)
    producto = Producto(**datos)
    db_session.add(producto)
    db_session.commit()
    db_session.refresh(producto)
    return producto


def _vender(client, token, producto, cantidad, es_decant=True, precio=1.50):
    return client.post(
        "/api/sales",
        json={
            "Cliente": "Cliente Decant",
            "MetodoPago": "Efectivo",
            "DescuentoPorcentaje": 0,
            "EfectivoRecibido": 500.00,
            "Detalles": [
                {
                    "IdProducto": producto.Id,
                    "Cantidad": cantidad,
                    "PrecioUnitario": precio,
                    "EsDecant": es_decant,
                }
            ],
        },
        headers={"Authorization": f"Bearer {token}"},
    )


@pytest.fixture()
def caja_abierta(client, admin_token):
    response = client.post(
        "/api/caja/apertura",
        params={"monto": 500.00},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201, response.text


class TestVentaDecant:
    def test_venta_decant_descuenta_ml(self, client, admin_token, config_empresa, db_session, caja_abierta):
        producto = _crear_producto_decant(db_session, MililitrosDisponibles=100)

        response = _vender(client, admin_token, producto, 30)
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["Detalles"][0]["EsDecant"] is True

        db_session.refresh(producto)
        assert producto.StockActual == 3
        assert producto.MililitrosDisponibles == 70

    def test_venta_decant_abre_botella_cuando_falta_ml(self, client, admin_token, config_empresa, db_session, caja_abierta):
        producto = _crear_producto_decant(db_session, MililitrosDisponibles=70)

        response = _vender(client, admin_token, producto, 150)
        assert response.status_code == 201, response.text

        db_session.refresh(producto)
        assert producto.StockActual == 2
        assert producto.MililitrosDisponibles == 20

    def test_venta_decant_rechaza_multiplos_invalidos(self, client, admin_token, config_empresa, db_session, caja_abierta):
        producto = _crear_producto_decant(db_session)

        response = _vender(client, admin_token, producto, 7)
        assert response.status_code == 400
        assert "múltiplos de 5" in response.json()["detail"]

        db_session.refresh(producto)
        assert producto.StockActual == 3
        assert producto.MililitrosDisponibles == 0

    def test_venta_decant_requiere_producto_habilitado(self, client, admin_token, config_empresa, db_session, caja_abierta):
        producto = _crear_producto_decant(db_session, Dicans=False)

        response = _vender(client, admin_token, producto, 10)
        assert response.status_code == 400
        assert "decants" in response.json()["detail"].lower()

    def test_ticket_incluye_es_decant(self, client, admin_token, config_empresa, db_session, caja_abierta):
        producto = _crear_producto_decant(db_session)

        response = _vender(client, admin_token, producto, 10)
        assert response.status_code == 201, response.text
        venta_id = response.json()["Id"]

        ticket = client.get(
            f"/api/sales/{venta_id}/invoice",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert ticket.status_code == 200, ticket.text
        assert ticket.json()["items"][0]["es_decant"] is True

    def test_editar_venta_decant_restaura_y_descuenta_ml(self, client, admin_token, config_empresa, db_session, caja_abierta):
        producto = _crear_producto_decant(db_session, MililitrosDisponibles=100)

        response = _vender(client, admin_token, producto, 20)
        assert response.status_code == 201, response.text
        venta_id = response.json()["Id"]

        db_session.refresh(producto)
        assert producto.MililitrosDisponibles == 80

        edicion = client.put(
            f"/api/sales/{venta_id}",
            json={
                "Cliente": "Cliente Decant",
                "MetodoPago": "Efectivo",
                "DescuentoPorcentaje": 0,
                "EfectivoRecibido": 500.00,
                "Detalles": [
                    {
                        "IdProducto": producto.Id,
                        "Cantidad": 45,
                        "PrecioUnitario": 1.50,
                        "EsDecant": True,
                    }
                ],
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert edicion.status_code == 200, edicion.text

        db_session.refresh(producto)
        assert producto.StockActual == 3
        assert producto.MililitrosDisponibles == 55
