"""Pruebas del módulo de Productos (Inventario de Fragancias)."""

import pytest


class TestListarProductos:
    def test_listar_productos_vacio(self, client, admin_token):
        response = client.get(
            "/api/products",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert response.json() == []

    def test_listar_productos_con_datos(self, client, admin_token, db_session):
        from app.models import Producto

        p1 = Producto(
            SKU="PRF-001",
            Nombre="Chanel N°5",
            Categoria="Damas",
            Costo=95.00,
            PrecioVenta=165.00,
            StockActual=14,
            Activo=True,
        )
        p2 = Producto(
            SKU="PRF-002",
            Nombre="Dior Sauvage",
            Categoria="Caballeros",
            Costo=88.00,
            PrecioVenta=155.00,
            StockActual=9,
            Activo=True,
        )
        db_session.add_all([p1, p2])
        db_session.commit()

        response = client.get(
            "/api/products",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        skus = {item["SKU"] for item in data}
        assert skus == {"PRF-001", "PRF-002"}

    def test_filtrar_por_categoria(self, client, admin_token, db_session):
        from app.models import Producto

        p1 = Producto(
            SKU="CAT-001",
            Nombre="Perfume Damas 1",
            Categoria="Damas",
            Costo=50.00,
            PrecioVenta=100.00,
            StockActual=5,
            Activo=True,
        )
        p2 = Producto(
            SKU="CAT-002",
            Nombre="Perfume Caballeros 1",
            Categoria="Caballeros",
            Costo=60.00,
            PrecioVenta=120.00,
            StockActual=3,
            Activo=True,
        )
        db_session.add_all([p1, p2])
        db_session.commit()

        response = client.get(
            "/api/products?categoria=Damas",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["Categoria"] == "Damas"


class TestCrearEditarProducto:
    def test_crear_producto_admin(self, client, admin_token):
        response = client.post(
            "/api/products",
            json={
                "SKU": "NEW-001",
                "Nombre": "Nuevo Perfume",
                "Descripcion": "Descripción de prueba",
                "Categoria": "Unisex",
                "Costo": 40.00,
                "PrecioVenta": 80.00,
                "StockActual": 20,
                "StockMinimo": 4,
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["SKU"] == "NEW-001"
        assert data["Nombre"] == "Nuevo Perfume"
        assert float(data["Costo"]) == 40.00
        assert float(data["PrecioVenta"]) == 80.00

    def test_crear_producto_sku_duplicado(self, client, admin_token, db_session):
        from app.models import Producto

        existente = Producto(
            SKU="DUP-001",
            Nombre="Existente",
            Categoria="Damas",
            Costo=10.00,
            PrecioVenta=20.00,
            StockActual=5,
            Activo=True,
        )
        db_session.add(existente)
        db_session.commit()

        response = client.post(
            "/api/products",
            json={
                "SKU": "DUP-001",
                "Nombre": "Duplicado",
                "Categoria": "Damas",
                "Costo": 10.00,
                "PrecioVenta": 20.00,
                "StockActual": 5,
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 400

    def test_actualizar_producto_admin(self, client, admin_token, db_session):
        from app.models import Producto

        p = Producto(
            SKU="UPD-001",
            Nombre="Original",
            Categoria="Damas",
            Costo=30.00,
            PrecioVenta=60.00,
            StockActual=8,
            Activo=True,
        )
        db_session.add(p)
        db_session.commit()
        db_session.refresh(p)

        response = client.put(
            f"/api/products/{p.Id}",
            json={"Nombre": "Actualizado", "PrecioVenta": 75.00},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["Nombre"] == "Actualizado"
        assert float(data["PrecioVenta"]) == 75.00


class TestRBACCostoOculto:
    def test_costo_visible_para_admin(self, client, admin_token, db_session):
        from app.models import Producto

        p = Producto(
            SKU="COST-001",
            Nombre="Producto Costo",
            Categoria="Damas",
            Costo=25.00,
            PrecioVenta=50.00,
            StockActual=10,
            Activo=True,
        )
        db_session.add(p)
        db_session.commit()

        response = client.get(
            f"/api/products/{p.Id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert float(data["Costo"]) == 25.00

    def test_costo_oculto_para_cajero(self, client, cajero_token, db_session):
        from app.models import Producto

        p = Producto(
            SKU="COST-002",
            Nombre="Producto Costo Cajero",
            Categoria="Damas",
            Costo=25.00,
            PrecioVenta=50.00,
            StockActual=10,
            Activo=True,
        )
        db_session.add(p)
        db_session.commit()

        response = client.get(
            f"/api/products/{p.Id}",
            headers={"Authorization": f"Bearer {cajero_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["Costo"] is None