"""Reglas de negocio para ventas, edición de facturas y cálculo fiscal."""

import math
from decimal import Decimal
from typing import Iterable, List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models import DetalleVenta, MovimientoCaja, Producto, Usuario, Venta
from app.schemas import DetalleVentaOut, EditarVentaRequest, VentaCreate, VentaOut
from app.services.invoice_service import get_or_create_company, get_or_create_invoice_config


def calcular_totales(detalles: Iterable[dict], descuento_pct: Decimal, itbis_pct: Decimal):
    subtotal = sum((det["PrecioUnitario"] * det["Cantidad"] for det in detalles), Decimal("0"))
    descuento_monto = subtotal * (descuento_pct / Decimal("100"))
    base_imponible = subtotal - descuento_monto
    itbis = base_imponible * (itbis_pct / Decimal("100"))
    total = base_imponible + itbis
    return subtotal, descuento_monto, base_imponible, itbis, total


def _generar_numero_factura(db: Session, serie: str, prefijo: str) -> str:
    base = f"{prefijo}-{serie}-"
    ultima = (
        db.query(Venta)
        .filter(Venta.NumeroFactura.like(f"{base}%"))
        .order_by(Venta.Id.desc())
        .first()
    )
    numero = 1
    if ultima and ultima.NumeroFactura:
        try:
            numero = int(ultima.NumeroFactura.split("-")[-1]) + 1
        except (ValueError, IndexError):
            numero = 1
    return f"{base}{numero:06d}"


def _planificar_stock(db: Session, detalles: List[dict]):
    """Valida stock y calcula cuántos frascos completos y ml de decants se consumen."""
    cantidades_regular: dict[int, int] = {}
    ml_decant: dict[int, int] = {}
    for detalle in detalles:
        producto_id = detalle["IdProducto"]
        if detalle.get("EsDecant"):
            ml = int(detalle["Cantidad"])
            if ml <= 0 or ml % 5 != 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Los decants deben venderse en múltiplos de 5 ml.",
                )
            ml_decant[producto_id] = ml_decant.get(producto_id, 0) + ml
        else:
            cantidades_regular[producto_id] = cantidades_regular.get(producto_id, 0) + int(detalle["Cantidad"])

    productos: dict[int, Producto] = {}
    for producto_id in set(cantidades_regular) | set(ml_decant):
        producto = db.query(Producto).filter(Producto.Id == producto_id, Producto.Activo == True).first()
        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto {producto_id} no encontrado",
            )
        regular = cantidades_regular.get(producto_id, 0)
        ml = ml_decant.get(producto_id, 0)
        botellas = 0
        if ml > 0:
            if not producto.Dicans:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{producto.Nombre} no está habilitado para decants.",
                )
            if (producto.Mililitros or 0) <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{producto.Nombre} no tiene contenido en ml configurado.",
                )
            disponibles = producto.MililitrosDisponibles or 0
            if ml > disponibles:
                botellas = math.ceil((ml - disponibles) / producto.Mililitros)
        requeridas = regular + botellas
        if producto.StockActual < requeridas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Stock insuficiente para {producto.Nombre}. "
                    f"Frascos completos disponibles: {producto.StockActual}."
                ),
            )
        productos[producto_id] = producto
    return productos, cantidades_regular, ml_decant


def _aplicar_stock(
    productos: dict[int, Producto],
    cantidades_regular: dict[int, int],
    ml_decant: dict[int, int],
) -> None:
    for producto_id, producto in productos.items():
        regular = cantidades_regular.get(producto_id, 0)
        ml = ml_decant.get(producto_id, 0)
        if ml > 0:
            disponibles = producto.MililitrosDisponibles or 0
            botellas = math.ceil((ml - disponibles) / producto.Mililitros) if ml > disponibles else 0
            producto.StockActual -= regular + botellas
            producto.MililitrosDisponibles = disponibles + botellas * producto.Mililitros - ml
        else:
            producto.StockActual -= regular


def _devolver_ml(producto: Producto, ml: int) -> None:
    """Devuelve ml al inventario, convirtiendo frascos completos de nuevo en stock."""
    if ml <= 0:
        return
    producto.MililitrosDisponibles = (producto.MililitrosDisponibles or 0) + ml
    tamano = producto.Mililitros or 0
    if tamano > 0:
        while producto.MililitrosDisponibles >= tamano:
            producto.MililitrosDisponibles -= tamano
            producto.StockActual += 1


def _detalles_dict(detalles: Iterable) -> List[dict]:
    return [detalle.model_dump() if hasattr(detalle, "model_dump") else detalle for detalle in detalles]


def crear_venta(db: Session, venta_in: VentaCreate, current_user: Usuario) -> VentaOut:
    company = get_or_create_company(db)
    template = get_or_create_invoice_config(db)
    itbis_pct = company.ITBISPorcentaje

    detalles = _detalles_dict(venta_in.Detalles)
    productos, cantidades_regular, ml_decant = _planificar_stock(db, detalles)

    subtotal, descuento_monto, base_imponible, itbis, total = calcular_totales(
        detalles, venta_in.DescuentoPorcentaje, itbis_pct
    )

    cambio = None
    if venta_in.EfectivoRecibido is not None:
        cambio = max(Decimal("0"), venta_in.EfectivoRecibido - total)

    numero_factura = _generar_numero_factura(db, company.NCFSerie, template.PrefijoFactura)
    company.NCFSecuenciaActual = (company.NCFSecuenciaActual or 0) + 1

    venta = Venta(
        NumeroFactura=numero_factura,
        NCF=f"{company.NCFSerie}{company.NCFSecuenciaActual:08d}",
        IdUsuario=current_user.Id,
        Cliente=venta_in.Cliente,
        MetodoPago=venta_in.MetodoPago,
        Subtotal=subtotal,
        DescuentoPorcentaje=venta_in.DescuentoPorcentaje,
        DescuentoMonto=descuento_monto,
        BaseImponible=base_imponible,
        ITBIS=itbis,
        Total=total,
        EfectivoRecibido=venta_in.EfectivoRecibido,
        Cambio=cambio,
    )
    db.add(venta)
    db.flush()

    for detalle in detalles:
        producto = productos[detalle["IdProducto"]]
        db.add(
            DetalleVenta(
                IdVenta=venta.Id,
                IdProducto=producto.Id,
                SKU=producto.SKU,
                NombreProducto=producto.Nombre,
                Cantidad=detalle["Cantidad"],
                PrecioUnitario=detalle["PrecioUnitario"],
                Importe=detalle["PrecioUnitario"] * detalle["Cantidad"],
                EsDecant=bool(detalle.get("EsDecant")),
            )
        )

    _aplicar_stock(productos, cantidades_regular, ml_decant)

    db.add(
        MovimientoCaja(
            Tipo="Venta",
            Concepto=f"Venta Ticket {numero_factura}",
            MetodoPago=venta_in.MetodoPago,
            Monto=total,
            IdUsuario=current_user.Id,
            IdVenta=venta.Id,
        )
    )

    db.commit()
    db.refresh(venta)
    return venta_a_out(venta)


def editar_venta(db: Session, venta_id: int, datos: EditarVentaRequest, current_user: Usuario) -> VentaOut:
    venta = (
        db.query(Venta)
        .options(joinedload(Venta.detalles))
        .filter(Venta.Id == venta_id)
        .first()
    )
    if not venta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")

    company = get_or_create_company(db)

    for detalle_anterior in venta.detalles:
        producto = db.query(Producto).filter(Producto.Id == detalle_anterior.IdProducto).first()
        if producto:
            if detalle_anterior.EsDecant:
                _devolver_ml(producto, detalle_anterior.Cantidad)
            else:
                producto.StockActual += detalle_anterior.Cantidad

    nuevos = _detalles_dict(datos.Detalles)
    productos, cantidades_regular, ml_decant = _planificar_stock(db, nuevos)

    for detalle_anterior in list(venta.detalles):
        db.delete(detalle_anterior)
    db.flush()

    for detalle in nuevos:
        producto = productos[detalle["IdProducto"]]
        db.add(
            DetalleVenta(
                IdVenta=venta.Id,
                IdProducto=producto.Id,
                SKU=producto.SKU,
                NombreProducto=producto.Nombre,
                Cantidad=detalle["Cantidad"],
                PrecioUnitario=detalle["PrecioUnitario"],
                Importe=detalle["PrecioUnitario"] * detalle["Cantidad"],
                EsDecant=bool(detalle.get("EsDecant")),
            )
        )

    _aplicar_stock(productos, cantidades_regular, ml_decant)

    descuento_pct = datos.DescuentoPorcentaje if datos.DescuentoPorcentaje is not None else venta.DescuentoPorcentaje
    subtotal, descuento_monto, base_imponible, itbis, total = calcular_totales(nuevos, descuento_pct, company.ITBISPorcentaje)

    venta.Cliente = datos.Cliente or venta.Cliente
    venta.MetodoPago = datos.MetodoPago or venta.MetodoPago
    venta.DescuentoPorcentaje = descuento_pct
    venta.Subtotal = subtotal
    venta.DescuentoMonto = descuento_monto
    venta.BaseImponible = base_imponible
    venta.ITBIS = itbis
    venta.Total = total
    if datos.EfectivoRecibido is not None:
        venta.EfectivoRecibido = datos.EfectivoRecibido
    if venta.MetodoPago == "Efectivo" and venta.EfectivoRecibido is not None:
        venta.Cambio = max(Decimal("0"), venta.EfectivoRecibido - total)
    else:
        venta.Cambio = None

    movimiento = (
        db.query(MovimientoCaja)
        .filter(MovimientoCaja.IdVenta == venta.Id)
        .order_by(MovimientoCaja.Id.desc())
        .first()
    )
    if movimiento:
        movimiento.Concepto = f"Venta Ticket {venta.NumeroFactura}"
        movimiento.MetodoPago = venta.MetodoPago
        movimiento.Monto = total
    else:
        db.add(
            MovimientoCaja(
                Tipo="Venta",
                Concepto=f"Venta Ticket {venta.NumeroFactura}",
                MetodoPago=venta.MetodoPago,
                Monto=total,
                IdUsuario=current_user.Id,
                IdVenta=venta.Id,
            )
        )

    db.commit()
    db.refresh(venta)
    return venta_a_out(venta)


def venta_a_out(venta: Venta, caja_cerrada: bool | None = None) -> VentaOut:
    detalles = [
        DetalleVentaOut(
            Id=detalle.Id,
            IdVenta=detalle.IdVenta,
            IdProducto=detalle.IdProducto,
            SKU=detalle.SKU,
            NombreProducto=detalle.NombreProducto,
            Cantidad=detalle.Cantidad,
            PrecioUnitario=detalle.PrecioUnitario,
            Importe=detalle.Importe,
            EsDecant=detalle.EsDecant,
        )
        for detalle in venta.detalles
    ]
    return VentaOut(
        Id=venta.Id,
        NumeroFactura=venta.NumeroFactura,
        NCF=venta.NCF,
        FechaVenta=venta.FechaVenta,
        IdUsuario=venta.IdUsuario,
        Cliente=venta.Cliente,
        MetodoPago=venta.MetodoPago,
        Subtotal=venta.Subtotal,
        DescuentoPorcentaje=venta.DescuentoPorcentaje,
        DescuentoMonto=venta.DescuentoMonto,
        BaseImponible=venta.BaseImponible,
        ITBIS=venta.ITBIS,
        Total=venta.Total,
        EfectivoRecibido=venta.EfectivoRecibido,
        Cambio=venta.Cambio,
        Activo=venta.Activo,
        FechaCreacion=venta.FechaCreacion,
        Cajero=venta.usuario.Nombre if venta.usuario else None,
        CajaCerrada=caja_cerrada,
        Detalles=detalles,
    )
