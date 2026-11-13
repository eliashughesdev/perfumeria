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
import { useAuth } from '@/contexts/AuthContext'
import { productService, saleService } from '@/services/api'
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

  const { usuario, token, login, isLoading, isAuthenticated } = useAuth()
  const [loginEmail, setLoginEmail] = useState('admin@lessence.com')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)

  useEffect(() => {
    if (usuario) {
      setRole(usuario.rol === 'ROLE_ADMIN' ? 'admin' : 'cajero')
    }
  }, [usuario])

  const mapProduct = (p: any) => ({
    id: p.Id ?? p.id,
    sku: p.SKU ?? p.sku,
    nombre: p.Nombre ?? p.nombre,
    descripcion: p.Descripcion ?? p.descripcion,
    categoria: p.Categoria ?? p.categoria,
            costo: p.Costo != null || p.costo != null ? Number(p.Costo ?? p.costo) : null,
    precioVenta: Number(p.PrecioVenta ?? p.precioVenta ?? 0),
    stockActual: p.StockActual ?? p.stockActual ?? 0,
    stockMinimo: p.StockMinimo ?? p.stockMinimo ?? 0,
    imagenUrl: p.ImagenUrl ?? p.imagenUrl,
    activo: p.Activo ?? p.activo ?? true,
  })

  const loadProducts = useCallback(() => {
    if (!token) return
    productService
      .list()
      .then((res) => setProducts((res.data as any[]).map(mapProduct)))
      .catch((err) => console.error('Error cargando productos', err))
  }, [token])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    setLowStockCount(products.filter((p) => p.stockActual <= (p.stockMinimo || 4)).length)
  }, [products])

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
      Cliente: clientName || 'CONSUMIDOR FINAL',
      MetodoPago: paymentMethod,
      DescuentoPorcentaje: discountPct,
      EfectivoRecibido: paymentMethod === 'Efectivo' ? cashReceived : undefined,
      Detalles: cart.map((item: any) => ({
        IdProducto: item.idProducto,
        SKU: item.sku,
        NombreProducto: item.nombreProducto,
        Cantidad: item.cantidad,
        PrecioUnitario: item.precioUnitario,
      })),
    }

    try {
      const res = await saleService.create(venta)
      const ventaId = (res.data as any).Id ?? (res.data as any).id
      const invoiceRes = await saleService.invoice(ventaId)
      const raw = invoiceRes.data as any
      const invoice = {
        empresa: {
          nombre: raw.empresa?.nombre,
          razonSocial: raw.empresa?.razonSocial ?? raw.empresa?.razon_social,
          rnc: raw.empresa?.rnc,
          direccion: raw.empresa?.direccion,
          ciudad: raw.empresa?.ciudad,
          telefono: raw.empresa?.telefono,
        },
        factura: {
          numero: raw.factura?.numero,
          ncf: raw.factura?.ncf,
          fecha: raw.factura?.fecha,
          cajero: raw.factura?.cajero,
          cliente: raw.factura?.cliente,
          metodoPago: raw.factura?.metodoPago ?? raw.factura?.metodo_pago,
        },
        items: (raw.items || []).map((item: any) => ({
          cantidad: item.cantidad,
          sku: item.sku,
          nombre: item.nombre,
          precioUnitario: Number(item.precioUnitario ?? item.precio_unitario ?? 0),
          importe: Number(item.importe ?? 0),
        })),
        totales: {
          subtotal: Number(raw.totales?.subtotal ?? 0),
          descuento: Number(raw.totales?.descuento ?? 0),
          itbis: Number(raw.totales?.itbis ?? 0),
          total: Number(raw.totales?.total ?? 0),
          efectivoRecibido: raw.totales?.efectivoRecibido ?? raw.totales?.efectivo_recibido,
          cambio: raw.totales?.cambio,
        },
      }

      sessionStorage.setItem('last_invoice', JSON.stringify(invoice))
      setIsCheckoutOpen(false)
      setCart([])
      setClientName('')
      setDiscountPct(0)
      setInvoiceSequence((s) => s + 1)
      setIsInvoiceOpen(true)
      loadProducts()
      showToast('Venta registrada y ticket generado.')
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      showToast(typeof detail === 'string' ? detail : 'Error al procesar la venta.')
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginBusy(true)
    setLoginError('')
    try {
      await login({ email: loginEmail, password: loginPassword })
    } catch {
      setLoginError('Credenciales inválidas')
    } finally {
      setLoginBusy(false)
    }
  }

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center text-slate-500 text-sm">Cargando sesión...</div>
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-plum-950 px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl space-y-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-plum-900">L'ESSENCE</h1>
            <p className="text-xs text-slate-500 mt-1">Inicia sesión para abrir el punto de venta</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Correo</label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Contraseña</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
              required
            />
          </div>
          {loginError && <p className="text-xs text-rose-600">{loginError}</p>}
          <button type="submit" disabled={loginBusy} className="w-full py-3 rounded-xl bg-plum-900 text-white text-sm font-bold disabled:opacity-60">
            {loginBusy ? 'Entrando...' : 'Entrar'}
          </button>
          <p className="text-[11px] text-slate-400">Admin: admin@lessence.com · Cajero: caja1@lessence.com · Admin123!</p>
        </form>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col overflow-hidden relative h-screen">
        <Toast message={toast.message} visible={toast.visible} onClose={() => setToast((t) => ({ ...t, visible: false }))} />

        <Header />

        <div className="flex-1 flex overflow-hidden relative">
          <Sidebar
            currentView={currentView}
            setCurrentView={setCurrentView as (key: string) => void}
            isAdmin={role === 'admin'}
            lowStockCount={lowStockCount}
          />

          <main className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">
            {currentView === 'pos' && (
              <>
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
              </>
            )}

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
              onSave={async (newProd: any) => {
                try {
                  const res = await productService.create({
                    SKU: newProd.sku,
                    Nombre: newProd.name,
                    Descripcion: newProd.description,
                    Categoria: newProd.category === 'Árabes / Nicho' ? 'Nicho' : newProd.category,
                    Costo: newProd.cost,
                    PrecioVenta: newProd.price,
                    StockActual: newProd.stock,
                    StockMinimo: 4,
                    ImagenUrl: newProd.image && String(newProd.image).length < 900 ? newProd.image : null,
                    Activo: true,
                  } as any)
                  const saved = mapProduct(res.data)
                  if (newProd.image) saved.imagenUrl = newProd.image
                  setProducts((prev: any[]) => [saved, ...prev])
                  setIsNewProductOpen(false)
                  showToast('Perfume registrado en el catálogo.')
                } catch (err: any) {
                  showToast(err?.response?.data?.detail || 'No se pudo guardar el perfume.')
                }
              }}
              isAdmin={role === 'admin'}
            />
          </main>
        </div>
      </div>
    </>
  )
}

export default App
