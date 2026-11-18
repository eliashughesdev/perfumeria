"""Datos iniciales de Nurfa Essenci Perfumería.

Ejecución manual: `python -m app.seed`
También se ejecuta al iniciar si AUTO_SEED=true y la base está vacía.
"""

from app.database import Base, SessionLocal, engine
from app.models import Producto, Usuario
from app.permissions import DEFAULT_ROLE_PERMISSIONS, serialize_permissions
from app.security import hash_password
from app.services.invoice_service import get_or_create_company, get_or_create_invoice_config

PRODUCTOS_DEMO = [
    ("PRF-001", "Chanel N°5 Eau de Parfum 100ml", "Clásico floral aldehídico con rosa de mayo, jazmín, ylang-ylang y vainilla bourbon.", "Damas", 95.00, 165.00, 14),
    ("PRF-002", "Dior Sauvage Elixir 60ml", "Fragancia concentrada con canela, nuez moscada, lavanda y sándalo.", "Caballeros", 88.00, 155.00, 9),
    ("PRF-003", "Lattafa Khamrah 100ml", "Perfume árabe dulce y especiado con dátiles, praliné, canela y haba tonka.", "Nicho", 28.00, 65.00, 22),
    ("PRF-004", "Carolina Herrera Good Girl 80ml", "Aroma sensual de almendra, café, nardos, jazmín sambac y cacao tostado.", "Damas", 72.00, 130.00, 3),
    ("PRF-005", "Bleu de Chanel Parfum 100ml", "Amaderado aromático con frescura cítrica, cedro de Nueva Caledonia y sándalo.", "Caballeros", 92.00, 160.00, 11),
    ("PRF-006", "CK One Eau de Toilette 200ml", "Fresco cítrico verde con bergamota, té verde, papaya y almizcle limpio.", "Unisex", 32.00, 68.00, 18),
    ("PRF-007", "YSL Libre Intense 90ml", "Fusión floral cálida de lavanda francesa, flor de azahar, orquídea y vainilla.", "Damas", 80.00, 145.00, 2),
    ("PRF-008", "Creed Aventus 100ml", "Chipre frutal de lujo con piña, bergamota, abedul ahumado y ámbar gris.", "Nicho", 210.00, 340.00, 5),
]


def run_seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Usuario).count() == 0:
            db.add_all(
                [
                    Usuario(
                        Nombre="Administradora Nurfa",
                        Email="admin@nurfaessenci.com",
                        PasswordHash=hash_password("Admin123!"),
                        Rol="ROLE_ADMIN",
                        Permisos=serialize_permissions(DEFAULT_ROLE_PERMISSIONS["ROLE_ADMIN"]),
                        Activo=True,
                    ),
                    Usuario(
                        Nombre="Cajero Nurfa",
                        Email="caja1@nurfaessenci.com",
                        PasswordHash=hash_password("Admin123!"),
                        Rol="ROLE_CAJERO",
                        Permisos=serialize_permissions(DEFAULT_ROLE_PERMISSIONS["ROLE_CAJERO"]),
                        Activo=True,
                    ),
                ]
            )

        get_or_create_company(db)
        get_or_create_invoice_config(db)

        if db.query(Producto).count() == 0:
            db.add_all(
                [
                    Producto(
                        SKU=sku,
                        Nombre=nombre,
                        Descripcion=descripcion,
                        Categoria=categoria,
                        Costo=costo,
                        PrecioVenta=precio,
                        StockActual=stock,
                        StockMinimo=4,
                        Activo=True,
                    )
                    for sku, nombre, descripcion, categoria, costo, precio, stock in PRODUCTOS_DEMO
                ]
            )

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
    print("Datos iniciales de Nurfa Essenci cargados correctamente.")
