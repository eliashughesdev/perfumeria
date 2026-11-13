import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Receipt, CreditCard, X, ShoppingBag } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Toast } from '@/components/layout/Toast'
import { CheckoutModal } from '@/components/checkout/CheckoutModal'
import { InvoicePreviewModal } from '@/components/invoice/InvoicePreviewModal'
import { ProductDetailModal } from '@/components/inventario/ProductDetailModal'
import { NewProductModal } from '@/components/inventario/NewProductModal'
import { ProductCatalog } from '@/components/pos/ProductCatalog'
import { CartPanel } from '@/components/pos/CartPanel'
import { CajaView } from '@/components/caja/CajaView'
import { InventarioView } from '@/components/inventario/InventarioView'
import { ContabilidadView } from '@/components/contabilidad/ContabilidadView'
import { UsuariosView } from '@/components/usuarios/UsuariosView'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import type { DetalleVenta } from '@/types'

type ViewName = 'pos' | 'caja' | 'inventario' | 'contabilidad' | 'usuarios'

interface CartItem extends DetalleVenta {
  importe: number
}

function App() {
  const [currentView, setCurrentView] = useState<ViewName>('pos')
  const [role, setRole] = useState<'admin' | 'cajero'>('admin')
  const [cart, setCart] = useState<CartItem[]>([])
  const [currentCategory, setCurrentCategory] = useState('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [discountPct, setDiscountPct] = useState(0)
  const [clientName, setClientName] = useState('')
  const [invoiceSequence, setInvoiceSequence] = useState(42)
  const [toast, setToast] = useState({ message: '', visible: false })
  const [products, setProducts] = useState<any[]>([])
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isNewProductOpen, setIsNewProductOpen] = useState(false)
  const [detailProduct, setDetailProduct] = useState<any | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo')
  const [cashReceived, setCashReceived] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)

  const { usuario } = useAuth()

  useEffect(() => {
    if (usuario) {
      setRole(usuario.rol === 'ROLE_ADMIN' ? 'admin' : 'cajero')
    }
  }, [usuario])

  const showToast = useCallback((msg: string) => {
    setToast({ message: msg, visible: true })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3200)
  }, [])

  const filteredProducts = products.filter((p: any) => {
    const matchCat = currentCategory === 'Todos' || p.categoria === currentCategory
    const q = searchQuery.toLowerCase()
    const matchQuery =
      p.nombre.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(q))
    return matchCat && matchQuery
  })

  const addToCart = (productId: number) => {
    const product = products.find((p: any) => p.id === productId)
    if (!product || product.stockActual <= 0) return
    setCart((prev) => {
      const existing = prev.find((item) => item.idProducto === productId)
      if (existing) {
        if (existing.cantidad < product.stockActual!) {
          return prev.map((item) =>
            item.idProducto === productId ? { ...item, cantidad: item.cantidad + 1, importe: item.precioUnitario * (item.cantidad + 1) } : item
          )
        }
        showToast('Stock máximo alcanzado para este perfume.')
        return prev
      }
      showToast(`${product.nombre} agregado al ticket.`)
      const nuevo: CartItem = {
        idProducto: product.id,
        cantidad: 1,
        precioUnitario: product.precioVenta,
        sku: product.sku,
        nombreProducto: product.nombre,
        importe: product.precioVenta,
      }
      return [...prev, nuevo]
    })
  }

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.idProducto === productId)
      if (idx === -1) return prev
      const product = products.find((p: any) => p.id === productId)
      const newQty = prev[idx].cantidad + delta
      if (newQty <= 0) {
        return prev.filter((item) => item.idProducto !== productId)
      }
      if (newQty <= (product?.stockActual ?? 0)) {
        return prev.map((item, i) =>
          i === idx ? { ...item, cantidad: newQty, importe: item.precioUnitario * newQty } : item
        )
      }
      return prev
    })
  }

  const clearCart = () => {
    setCart([])
    setClientName('')
    setDiscountPct(0)
  }

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0)
    const discountAmount = subtotal * (discountPct / 100)
    const taxedBase = subtotal - discountAmount
    const tax = taxedBase * 0.18
    const total = taxedBase + tax
    return { subtotal, discountAmount, tax, total }
  }

  const openCheckoutModal = () => {
    const { total } = calculateTotals()
    setCashReceived(Math.ceil(total))
    setIsCheckoutOpen(true)
  }

  const completeSale = async () => {
    const { subtotal, discountAmount, tax, total } = calculateTotals()
    const venta: any = {
      cliente: clientName || 'CONSUMIDOR FINAL',
      metodoPago: paymentMethod,
      descuentoPorcentaje: discountPct,
      efectivoRecibido: paymentMethod === 'Efectivo' ? cashReceived : undefined,
      detalles: cart.map((item: any) => ({
        idProducto: item.idProducto,
        sku: item.sku,
        nombreProducto: item.nombreProducto,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
      })),
    }

    try {
      const res = await fetch('http://localhost:8050/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('lessence_token')}`,
        },
        body: JSON.stringify(venta),
      })
      if (!res.ok) throw new Error('Error al registrar venta')
      const data = await res.json()

      setIsCheckoutOpen(false)
      setCart([])
      setClientName('')
      setDiscountPct(0)
      setInvoiceSequence((s) => s + 1)

      setIsInvoiceOpen(true)
      sessionStorage.setItem('last_invoice', JSON.stringify(data))
      showToast('Venta registrada y ticket generado.')
    } catch (err) {
      showToast('Error al procesar la venta.')
      console.error(err)
    }
  }

  const calculateChange = () => {
    const { total } = calculateTotals()
    return Math.max(0, cashReceived - total)
  }

  const openProductDetail = (id: number) => {
    const p = products.find((item: any) => item.id === id)
    if (p) {
      setDetailProduct(p)
      setIsDetailOpen(true)
    }
  }

  return (
    <AuthProvider>
      <div className="flex-1 flex overflow-hidden relative h-screen">
        <Toast message={toast.message} visible={toast.visible} onClose={() => setToast((t) => ({ ...t, visible: false }))} />

        <Header />

        <div className="flex-1 flex overflow-hidden relative">
          <Sidebar
            currentView={currentView}
            setCurrentView={setCurrentView as (key: string) => void}
            isAdmin={role === 'admin'}
            lowStockCount={lowStockCount}
          />

          <main className="flex-1 overflow-hidden flex flex-col relative">
            <ProductCatalog
              products={filteredProducts}
              currentCategory={currentCategory}
              setCurrentCategory={setCurrentCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              addToCart={addToCart}
            />

            <CartPanel
              cart={cart}
              updateQty={updateQty}
              clearCart={clearCart}
              discountPct={discountPct}
              setDiscountPct={setDiscountPct}
              clientName={clientName}
              setClientName={setClientName}
              openCheckoutModal={openCheckoutModal}
              calculateTotals={calculateTotals}
            />

            {currentView === 'caja' && <CajaView showToast={showToast} />}
            {currentView === 'inventario' && (
              <InventarioView
                products={products}
                setProducts={setProducts}
                isAdmin={role === 'admin'}
                setLowStockCount={setLowStockCount}
                openNewProductModal={() => setIsNewProductOpen(true)}
                openProductDetail={openProductDetail}
              />
            )}
            {currentView === 'contabilidad' && <ContabilidadView isAdmin={role === 'admin'} showToast={showToast} />}
            {currentView === 'usuarios' && <UsuariosView isAdmin={role === 'admin'} showToast={showToast} />}

            <CheckoutModal
              isOpen={isCheckoutOpen}
              onClose={() => setIsCheckoutOpen(false)}
              total={calculateTotals().total}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              cashReceived={cashReceived}
              setCashReceived={setCashReceived}
              calculateChange={calculateChange}
              onComplete={completeSale}
            />

            <InvoicePreviewModal
              isOpen={isInvoiceOpen}
              onClose={() => setIsInvoiceOpen(false)}
            />

            <ProductDetailModal
              isOpen={isDetailOpen}
              product={detailProduct}
              onClose={() => setIsDetailOpen(false)}
              isAdmin={role === 'admin'}
              onAddToCart={(id: number) => {
                addToCart(id)
                setIsDetailOpen(false)
                showToast(`${detailProduct?.nombre} agregado al ticket.`)
              }}
              isRoleCajero={role !== 'admin'}
            />

            <NewProductModal
              isOpen={isNewProductOpen}
              onClose={() => setIsNewProductOpen(false)}
              onSave={(newProd: any) => {
                setProducts((prev: any[]) => [newProd, ...prev])
                setIsNewProductOpen(false)
                showToast('Perfume registrado con foto y descripción en el catálogo.')
              }}
              isAdmin={role === 'admin'}
            />
          </main>
        </div>
      </div>
    </AuthProvider>
  )
}

export default App
