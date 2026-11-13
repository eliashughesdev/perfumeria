import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Componente que simula la visibilidad de costos y módulos según rol RBAC
const RBACVisibilityDemo: React.FC<{ role: 'ROLE_ADMIN' | 'ROLE_CAJERO' }> = ({ role }) => {
  const isAdmin = role === 'ROLE_ADMIN'
  const producto = { nombre: 'Chanel N°5', costo: 95.00, precioVenta: 165.00 }

  return (
    <div>
      <span data-testid="user-role">{role}</span>
      <span data-testid="product-price">{producto.precioVenta.toFixed(2)}</span>
      {isAdmin ? (
        <span data-testid="product-cost">{producto.costo.toFixed(2)}</span>
      ) : (
        <span data-testid="cost-hidden">Oculto (RBAC)</span>
      )}
      <span data-testid="modulo-pos">Punto de Venta</span>
      {isAdmin && <span data-testid="modulo-contabilidad">Contabilidad</span>}
      {isAdmin && <span data-testid="modulo-usuarios">Usuarios & RBAC</span>}
    </div>
  )
}

describe('RBACVisibility', () => {
  it('oculta costos de productos para rol Cajero', () => {
    render(<RBACVisibilityDemo role="ROLE_CAJERO" />)

    expect(screen.getByTestId('user-role')).toHaveTextContent('ROLE_CAJERO')
    expect(screen.getByTestId('product-price')).toHaveTextContent('165.00')
    expect(screen.queryByTestId('product-cost')).not.toBeInTheDocument()
    expect(screen.getByTestId('cost-hidden')).toHaveTextContent('Oculto (RBAC)')
  })

  it('muestra costos de productos para rol Admin', () => {
    render(<RBACVisibilityDemo role="ROLE_ADMIN" />)

    expect(screen.getByTestId('user-role')).toHaveTextContent('ROLE_ADMIN')
    expect(screen.getByTestId('product-cost')).toHaveTextContent('95.00')
    expect(screen.queryByTestId('cost-hidden')).not.toBeInTheDocument()
  })

  it('oculta módulo Contabilidad para Cajero', () => {
    render(<RBACVisibilityDemo role="ROLE_CAJERO" />)

    expect(screen.queryByTestId('modulo-contabilidad')).not.toBeInTheDocument()
  })

  it('muestra módulo Contabilidad para Admin', () => {
    render(<RBACVisibilityDemo role="ROLE_ADMIN" />)

    expect(screen.getByTestId('modulo-contabilidad')).toHaveTextContent('Contabilidad')
  })

  it('oculta módulo Usuarios para Cajero', () => {
    render(<RBACVisibilityDemo role="ROLE_CAJERO" />)

    expect(screen.queryByTestId('modulo-usuarios')).not.toBeInTheDocument()
  })

  it('muestra módulo Usuarios para Admin', () => {
    render(<RBACVisibilityDemo role="ROLE_ADMIN" />)

    expect(screen.getByTestId('modulo-usuarios')).toHaveTextContent('Usuarios & RBAC')
  })

  it('ambos roles pueden ver el módulo POS', () => {
    const cajero = render(<RBACVisibilityDemo role="ROLE_CAJERO" />)
    expect(cajero.getByTestId('modulo-pos')).toHaveTextContent('Punto de Venta')
    cajero.unmount()

    const admin = render(<RBACVisibilityDemo role="ROLE_ADMIN" />)
    expect(admin.getByTestId('modulo-pos')).toHaveTextContent('Punto de Venta')
  })
})
