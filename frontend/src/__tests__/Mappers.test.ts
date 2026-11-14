import { describe, expect, it } from 'vitest'
import { mapMovimientoCaja, mapResumenCaja, mapVenta } from '@/services/mappers'

describe('mappers de caja', () => {
  it('convierte montos Decimal serializados como texto a números', () => {
    const summary = mapResumenCaja({
      Fecha: '2026-11-13',
      Estado: 'Cerrada',
      Abierta: false,
      FondoInicial: '150.00',
      VentasEfectivo: '0',
      VentasNoEfectivo: '0',
      IngresosExtra: '0',
      EgresosExtra: '0',
      EfectivoEsperado: '150.00',
      MontoContado: '150.00',
      Diferencia: '0.00',
    })

    expect(summary.efectivoEsperado).toBe(150)
    expect(summary.montoContado).toBe(150)
    expect(summary.diferencia).toBe(0)
    expect(typeof summary.diferencia).toBe('number')
  })

  it('convierte contado y diferencia de movimientos a números', () => {
    const movement = mapMovimientoCaja({
      Id: 2,
      Tipo: 'Cierre',
      Concepto: 'Arqueo de turno',
      Monto: '150.00',
      MontoContado: '149.50',
      Diferencia: '-0.50',
      IdUsuario: 1,
      FechaMovimiento: '2026-11-13T21:01:01',
    })

    expect(movement.monto).toBe(150)
    expect(movement.montoContado).toBe(149.5)
    expect(movement.diferencia).toBe(-0.5)
  })

  it('convierte efectivo recibido y cambio de ventas a números', () => {
    const sale = mapVenta({
      Id: 1,
      NumeroFactura: 'FAC-B02-000001',
      FechaVenta: '2026-11-13T21:00:00',
      IdUsuario: 1,
      Cliente: 'Consumidor Final',
      MetodoPago: 'Efectivo',
      Subtotal: '100.00',
      DescuentoPorcentaje: '0',
      DescuentoMonto: '0',
      BaseImponible: '100.00',
      ITBIS: '18.00',
      Total: '118.00',
      EfectivoRecibido: '120.00',
      Cambio: '2.00',
      Activo: true,
      FechaCreacion: '2026-11-13T21:00:00',
      Detalles: [],
    })

    expect(sale.total).toBe(118)
    expect(sale.efectivoRecibido).toBe(120)
    expect(sale.cambio).toBe(2)
  })
})
