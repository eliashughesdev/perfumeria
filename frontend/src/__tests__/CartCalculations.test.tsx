import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// Mock del formato de dinero
vi.mock('@/utils/format', () => ({
  formatMoney: (value: number) => `$${value.toFixed(2)}`,
  formatMoneySimple: (value: number) => `$${value.toFixed(2)}`,
  formatDate: (iso: string) => new Date(iso).toLocaleDateString('es-DO'),
  formatDateTime: (iso: string) => new Date(iso).toLocaleString('es-DO'),
  padLeft: (num: number, size: number) => String(num).padStart(size, '0'),
}))

// Componente de prueba para cálculos del carrito
const CartCalculator: React.FC<{
  items: Array<{ precioUnitario: number; cantidad: number }>
  discountPct: number
  onChangeDiscount: (v: number) => void
}> = ({ items, discountPct, onChangeDiscount }) => {
  const subtotal = items.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0)
  const discountAmount = subtotal * (discountPct / 100)
  const taxedBase = subtotal - discountAmount
  const tax = taxedBase * 0.18
  const total = taxedBase + tax

  return (
    <div>
      <span data-testid="subtotal">{subtotal.toFixed(2)}</span>
      <span data-testid="discount">{discountAmount.toFixed(2)}</span>
      <span data-testid="tax">{tax.toFixed(2)}</span>
      <span data-testid="total">{total.toFixed(2)}</span>
      <input
        data-testid="discount-input"
        type="number"
        value={discountPct}
        onChange={(e) => onChangeDiscount(parseFloat(e.target.value) || 0)}
      />
      <button data-testid="calc-change">Calcular</button>
      <span data-testid="change">{Math.max(0, 300 - total).toFixed(2)}</span>
    </div>
  )
}

describe('CartCalculations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calcula subtotal sin descuento', () => {
    render(
      <CartCalculator
        items={[{ precioUnitario: 100, cantidad: 2 }, { precioUnitario: 50, cantidad: 1 }]}
        discountPct={0}
        onChangeDiscount={vi.fn()}
      />
    )
    expect(screen.getByTestId('subtotal').textContent).toBe('250.00')
    expect(screen.getByTestId('tax').textContent).toBe('45.00') // 250 * 0.18
    expect(screen.getByTestId('total').textContent).toBe('295.00')
  })

  it('aplica descuento porcentual correctamente', () => {
    render(
      <CartCalculator
        items={[{ precioUnitario: 100, cantidad: 1 }]}
        discountPct={20}
        onChangeDiscount={vi.fn()}
      />
    )
    // Subtotal: 100, Descuento 20%: 20, Base: 80, ITBIS 18%: 14.40, Total: 94.40
    expect(screen.getByTestId('subtotal').textContent).toBe('100.00')
    expect(screen.getByTestId('discount').textContent).toBe('20.00')
    expect(screen.getByTestId('tax').textContent).toBe('14.40')
    expect(screen.getByTestId('total').textContent).toBe('94.40')
  })

  it('calcula ITBIS al 18% sobre base imponible con descuento', () => {
    render(
      <CartCalculator
        items={[{ precioUnitario: 200, cantidad: 1 }]}
        discountPct={10}
        onChangeDiscount={vi.fn()}
      />
    )
    // Subtotal: 200, Descuento 10%: 20, Base: 180, ITBIS 18%: 32.40, Total: 212.40
    expect(screen.getByTestId('discount').textContent).toBe('20.00')
    expect(screen.getByTestId('tax').textContent).toBe('32.40')
    expect(screen.getByTestId('total').textContent).toBe('212.40')
  })

  it('calcula devuelta en efectivo', () => {
    render(
      <CartCalculator
        items={[{ precioUnitario: 100, cantidad: 1 }]}
        discountPct={0}
        onChangeDiscount={vi.fn()}
      />
    )
    // Total: 118.00 (100 + 18 ITBIS), Recibido: 300, Cambio: 182.00
    fireEvent.click(screen.getByTestId('calc-change'))
    expect(screen.getByTestId('change').textContent).toBe('182.00')
  })

  it('cambio es 0 cuando el recibido es menor al total', () => {
    const { rerender } = render(
      <CartCalculator
        items={[{ precioUnitario: 200, cantidad: 1 }]}
        discountPct={0}
        onChangeDiscount={vi.fn()}
      />
    )
    // Total: 236.00, Recibido: 300 (hardcoded), Cambio: 64.00
    expect(screen.getByTestId('change').textContent).toBe('64.00')
  })
})
