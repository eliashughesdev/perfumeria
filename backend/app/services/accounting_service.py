"""Reportes contables: rentabilidad, ventas, inventario y medios de pago."""

from datetime import date, datetime, time
from decimal import Decimal

from sqlalchemy.orm import Session, joinedload

from app.models import MovimientoCaja, Producto, Venta
from app.services.sales_service import venta_a_out

ZERO = Decimal("0")


def _rango(desde: date, hasta: date):
    return (
        datetime.combine(desde, time.min),
        datetime.combine(hasta, time.max),
    )


def build_report(db: Session, desde: date, hasta: date) -> dict:
    inicio, fin = _rango(desde, hasta)

    ventas = (
        db.query(Venta)
        .options(joinedload(Venta.detalles))
        .filter(Venta.Activo == True, Venta.FechaVenta.between(inicio, fin))
        .order_by(Venta.FechaVenta.desc())
        .all()
    )

    productos = {p.Id: p for p in db.query(Producto).all()}

    ventas_brutas = ZERO
    subtotal = ZERO
    descuentos = ZERO
    itbis = ZERO
    costo_mercancia = ZERO
    unidades = 0

    serie: dict[str, dict] = {}
    top: dict[int, dict] = {}
    metodos: dict[str, dict] = {}

    for venta in ventas:
        ventas_brutas += venta.Total
        subtotal += venta.Subtotal
        descuentos += venta.DescuentoMonto
        itbis += venta.ITBIS

        dia = venta.FechaVenta.date().isoformat()
        serie.setdefault(dia, {"Ventas": ZERO, "Costo": ZERO})
        serie[dia]["Ventas"] += venta.Total

        metodo = metodos.setdefault(venta.MetodoPago, {"Monto": ZERO, "Tickets": 0})
        metodo["Monto"] += venta.Total
        metodo["Tickets"] += 1

        for detalle in venta.detalles:
            producto = productos.get(detalle.IdProducto)
            costo_unitario = producto.Costo if producto else ZERO
            costo_linea = costo_unitario * detalle.Cantidad
            costo_mercancia += costo_linea
            unidades += detalle.Cantidad
            serie[dia]["Costo"] += costo_linea

            acumulado = top.setdefault(
                detalle.IdProducto,
                {
                    "Nombre": detalle.NombreProducto or (producto.Nombre if producto else "Producto"),
                    "SKU": detalle.SKU,
                    "Unidades": 0,
                    "Ventas": ZERO,
                    "Costo": ZERO,
                },
            )
            acumulado["Unidades"] += detalle.Cantidad
            acumulado["Ventas"] += detalle.Importe
            acumulado["Costo"] += costo_linea

    gastos = (
        db.query(MovimientoCaja)
        .filter(
            MovimientoCaja.Tipo == "Egreso",
            MovimientoCaja.FechaMovimiento.between(inicio, fin),
        )
        .all()
    )
    gastos_caja = sum((movimiento.Monto for movimiento in gastos), ZERO)

    utilidad_bruta = ventas_brutas - costo_mercancia
    utilidad_neta = utilidad_bruta - gastos_caja
    margen = (utilidad_neta / ventas_brutas * Decimal("100")) if ventas_brutas else ZERO
    tickets = len(ventas)
    ticket_promedio = (ventas_brutas / tickets) if tickets else ZERO

    inventario = db.query(Producto).filter(Producto.Activo == True).all()
    valor_costo = sum((p.Costo * p.StockActual for p in inventario), ZERO)
    valor_venta = sum((p.PrecioVenta * p.StockActual for p in inventario), ZERO)
    stock_bajo = sum(1 for p in inventario if p.StockActual <= p.StockMinimo)

    serie_diaria = [
        {
            "Fecha": dia,
            "Ventas": datos["Ventas"],
            "Costo": datos["Costo"],
            "Utilidad": datos["Ventas"] - datos["Costo"],
        }
        for dia, datos in sorted(serie.items())
    ]

    top_productos = sorted(
        (
            {
                "Nombre": item["Nombre"],
                "SKU": item["SKU"],
                "Unidades": item["Unidades"],
                "Ventas": item["Ventas"],
                "Costo": item["Costo"],
                "Utilidad": item["Ventas"] - item["Costo"],
            }
            for item in top.values()
        ),
        key=lambda item: item["Ventas"],
        reverse=True,
    )[:10]

    metodos_pago = [
        {"Metodo": metodo, "Monto": datos["Monto"], "Tickets": datos["Tickets"]}
        for metodo, datos in sorted(metodos.items(), key=lambda item: item[1]["Monto"], reverse=True)
    ]

    return {
        "Desde": desde.isoformat(),
        "Hasta": hasta.isoformat(),
        "Totales": {
            "VentasBrutas": ventas_brutas,
            "Subtotal": subtotal,
            "Descuentos": descuentos,
            "ITBIS": itbis,
            "CostoMercancia": costo_mercancia,
            "GastosCaja": gastos_caja,
            "UtilidadBruta": utilidad_bruta,
            "UtilidadNeta": utilidad_neta,
            "MargenPorcentaje": margen,
            "Tickets": tickets,
            "TicketPromedio": ticket_promedio,
            "UnidadesVendidas": unidades,
        },
        "Inventario": {
            "Unidades": sum(p.StockActual for p in inventario),
            "ValorCosto": valor_costo,
            "ValorVenta": valor_venta,
            "StockBajo": stock_bajo,
        },
        "SerieDiaria": serie_diaria,
        "TopProductos": top_productos,
        "MetodosPago": metodos_pago,
        "VentasRecientes": [venta_a_out(venta) for venta in ventas[:15]],
    }
