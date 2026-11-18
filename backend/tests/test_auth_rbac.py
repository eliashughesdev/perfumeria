"""Pruebas de autenticación JWT y control de acceso RBAC."""

import pytest


class TestAuthLogin:
    def test_login_admin_exitoso(self, client, admin_user):
        response = client.post(
            "/api/auth/login",
            json={"email": "admin@nurfaessenci.com", "password": "Admin123!"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["rol"] == "ROLE_ADMIN"
        assert data["email"] == "admin@nurfaessenci.com"

    def test_login_cajero_exitoso(self, client, cajero_user):
        response = client.post(
            "/api/auth/login",
            json={"email": "caja1@nurfaessenci.com", "password": "Admin123!"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["rol"] == "ROLE_CAJERO"
        assert data["email"] == "caja1@nurfaessenci.com"

    def test_login_credenciales_invalidas(self, client):
        response = client.post(
            "/api/auth/login",
            json={"email": "admin@nurfaessenci.com", "password": "wrongpassword"},
        )
        assert response.status_code == 401

    def test_login_usuario_inexistente(self, client):
        response = client.post(
            "/api/auth/login",
            json={"email": "noexiste@nurfaessenci.com", "password": "Admin123!"},
        )
        assert response.status_code == 401


class TestAuthMe:
    def test_me_con_token_admin(self, client, admin_token):
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["Email"] == "admin@nurfaessenci.com"
        assert data["Rol"] == "ROLE_ADMIN"

    def test_me_con_token_cajero(self, client, cajero_token):
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {cajero_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["Email"] == "caja1@nurfaessenci.com"
        assert data["Rol"] == "ROLE_CAJERO"

    def test_me_sin_token(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code == 401

    def test_me_token_invalido(self, client):
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer token-invalido"},
        )
        assert response.status_code == 401


class TestRBACAccesoRutasAdmin:
    def test_cajero_no_puede_crear_producto(self, client, cajero_token):
        response = client.post(
            "/api/products",
            json={
                "SKU": "PRF-TEST-001",
                "Nombre": "Perfume Test",
                "Categoria": "Damas",
                "Costo": 50.00,
                "PrecioVenta": 100.00,
                "StockActual": 10,
            },
            headers={"Authorization": f"Bearer {cajero_token}"},
        )
        assert response.status_code == 403

    def test_cajero_no_puede_listar_usuarios(self, client, cajero_token):
        response = client.get(
            "/api/users",
            headers={"Authorization": f"Bearer {cajero_token}"},
        )
        assert response.status_code == 403

    def test_admin_puede_crear_producto(self, client, admin_token):
        response = client.post(
            "/api/products",
            json={
                "SKU": "PRF-TEST-002",
                "Nombre": "Perfume Admin Test",
                "Categoria": "Damas",
                "Costo": 50.00,
                "PrecioVenta": 100.00,
                "StockActual": 10,
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["SKU"] == "PRF-TEST-002"
        assert float(data["Costo"]) == 50.00
