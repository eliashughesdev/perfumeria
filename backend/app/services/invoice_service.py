"""Configuración fiscal y armado del comprobante de facturación."""

from datetime import datetime

from sqlalchemy.orm import Session

from app.models import ConfiguracionEmpresa, ConfiguracionFactura, Usuario, Venta

COMPANY_DEFAULTS = {
    "NombreComercial": "NURFA ESSENCIAL PERFUMERÍA",
    "RazonSocial": "NURFA ESSENCIAL SRL",
    "RNC": "1-31-84920-5",
    "Direccion": "Av. Independencia #104, Local 2B",
    "Ciudad": "San Pedro de Macorís",
    "Telefono": "(809) 529-4410",
    "Email": "contacto@nurfaessencial.com",
    "SitioWeb": "www.nurfaessencial.com",
    "RedesSociales": "@nurfaessencialperfumeria",
    "LogoUrl": "/logo.jpeg",
    "NCFSerie": "B02",
    "NCFSecuenciaActual": 0,
    "ITBISPorcentaje": 18.00,
    "MonedaSimbolo": "$",
    "Activo": True,
}

INVOICE_DEFAULTS = {
    "TituloTicket": "NURFA ESSENCIAL PERFUMERÍA",
    "MensajeAgradecimiento": "¡GRACIAS POR PREFERIRNOS!",
    "MensajeGarantia": "Conserve este ticket para fines de garantía.",
    "MensajePolitica": "No se aceptan devoluciones en perfumes destapados o sin su celofán original.",
    "MensajePie": "Nurfa Essencial Perfumería · Elegancia que se recuerda",
    "RedSocial": "@nurfaessencialperfumeria",
    "PrefijoFactura": "FAC",
    "AnchoTicketMm": 80,
    "MostrarLogo": True,
    "MostrarSKU": True,
    "MostrarCajero": True,
    "MostrarCliente": True,
    "MostrarNCF": True,
    "MostrarCodigoBarras": True,
    "Activo": True,
}


def get_or_create_company(db: Session) -> ConfiguracionEmpresa:
    company = db.query(ConfiguracionEmpresa).filter(ConfiguracionEmpresa.Activo == True).first()
    if company:
        return company
    company = ConfiguracionEmpresa(**COMPANY_DEFAULTS)
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def get_or_create_invoice_config(db: Session) -> ConfiguracionFactura:
    config = db.query(ConfiguracionFactura).filter(ConfiguracionFactura.Activo == True).first()
    if config:
        return config
    config = ConfiguracionFactura(**INVOICE_DEFAULTS)
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


def build_invoice_payload(db: Session, venta: Venta, cajero: Usuario) -> dict:
    company = get_or_create_company(db)
    template = get_or_create_invoice_config(db)

    return {
        "empresa": {
            "nombre": company.NombreComercial,
            "razon_social": company.RazonSocial,
            "rnc": company.RNC,
            "direccion": company.Direccion,
            "ciudad": company.Ciudad,
            "telefono": company.Telefono,
            "email": company.Email,
            "sitio_web": company.SitioWeb,
            "redes_sociales": company.RedesSociales,
            "logo_url": company.LogoUrl,
            "moneda": company.MonedaSimbolo,
            "itbis_porcentaje": float(company.ITBISPorcentaje),
        },
        "plantilla": {
            "titulo": template.TituloTicket,
            "agradecimiento": template.MensajeAgradecimiento,
            "garantia": template.MensajeGarantia,
            "politica": template.MensajePolitica,
            "pie": template.MensajePie,
            "red_social": template.RedSocial,
            "ancho_ticket_mm": template.AnchoTicketMm,
            "mostrar_logo": template.MostrarLogo,
            "mostrar_sku": template.MostrarSKU,
            "mostrar_cajero": template.MostrarCajero,
            "mostrar_cliente": template.MostrarCliente,
            "mostrar_ncf": template.MostrarNCF,
            "mostrar_codigo_barras": template.MostrarCodigoBarras,
        },
        "factura": {
            "numero": venta.NumeroFactura,
            "ncf": venta.NCF,
            "fecha": venta.FechaVenta.isoformat(),
            "cajero": cajero.Nombre,
            "cliente": venta.Cliente,
            "metodo_pago": venta.MetodoPago,
        },
        "items": [
            {
                "cantidad": item.Cantidad,
                "sku": item.SKU,
                "nombre": item.NombreProducto,
                "precio_unitario": float(item.PrecioUnitario),
                "importe": float(item.Importe),
            }
            for item in venta.detalles
        ],
        "totales": {
            "subtotal": float(venta.Subtotal),
            "descuento": float(venta.DescuentoMonto),
            "itbis": float(venta.ITBIS),
            "total": float(venta.Total),
            "efectivo_recibido": float(venta.EfectivoRecibido) if venta.EfectivoRecibido else None,
            "cambio": float(venta.Cambio) if venta.Cambio else None,
        },
        "generado_en": datetime.now().isoformat(),
    }
