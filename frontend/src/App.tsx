import { useState, useEffect, useCallback, useMemo } from 'react'
import type { FormEvent } from 'react'
import { Loader2, Moon, Sun } from 'lucide-react'
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
import { FacturasView } from '@/components/facturas/FacturasView'
import { UsuariosView } from '@/components/usuarios/UsuariosView'
import { ConfiguracionView } from '@/components/configuracion/ConfiguracionView'
import { InstallPWA } from '@/components/pwa/InstallPWA'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { configService, productService, saleService } from '@/services/api'
import { mapEmpresa, mapInvoice, mapProducto, mapVenta } from '@/services/mappers'
import type { ConfiguracionEmpresa, DetalleVenta, Producto } from '@/types'

type ViewName = 'pos' | 'caja' | 'inventario' | 'facturas' | 'contabilidad' | 'usuarios' | 'configuracion'
type PaymentMethod = 'Efectivo' | 'Tarjeta' | 'Transferencia'

interface CartItem extends DetalleVenta {
  importe: number
}

const VIEW_PERMISSIONS: Partial<Record<ViewName, 'pos.vender' | 'inventario.ver' | 'contabilidad.ver' | 'usuarios.gestionar' | 'factura.editar' | 'factura.configurar'>> = {
  pos: 'pos.vender',
  inventario: 'inventario.ver',
  facturas: 'factura.editar',
  contabilidad: 'contabilidad.ver',
  usuarios: 'usuarios.gestionar',
  configuracion: 'factura.configurar',
}

function App() {
  const { token, login, isLoading, isAuthenticated, hasPermission } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [currentView, setCurrentView] = useState<ViewName>('pos')
  const [cart, setCart] = useState<CartItem[]>([])
  const [currentCategory, setCurrentCategory] = useState('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [discountPct, setDiscountPct] = useState(0)
  const [clientName, setClientName] = useState('')
  const [toast, setToast] = useState({ message: '', visible: false })
  const [products, setProducts] = useState<Producto[]>([])
  const [company, setCompany] = useState<ConfiguracionEmpresa | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isNewProductOpen, setIsNewProductOpen] = useState(false)
  const [detailProduct, setDetailProduct] = useState<Producto | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo')
  const [cashReceived, setCashReceived] = useState(0)
  const [saleBusy, setSaleBusy] = useState(false)

  const [loginEmail, setLoginEmail] = useState('admin@nurfaessencial.com')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)

  const taxRate = company?.itbisPorcentaje ?? 18
  const canDiscount = hasPermission('pos.descuentos')
  const canEditProducts = hasPermission('inventario.editar')
  const canViewCost = hasPermission('inventario.costos')

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true })
    setTimeout(() => setToast((current) => ({ ...current, visible: false })), 3200)
  }, [])

  const loadProducts = useCallback(async () => {
    if (!token) return
    try {
      const response = await productService.list()
      setProducts((response.data as any[]).map(mapProducto))
    } catch (error) {
      console.error('Error cargando productos', error)
      showToast('No se pudo cargar el catálogo.')
    }
  }, [token, showToast])

  const loadCompany = useCallback(async () => {
    if (!token) return
    try {
      const response = await configService.get()
      setCompany(mapEmpresa(response.data as any))
    } catch (error) {
      console.error('Error cargando configuración', error)
    }
  }, [token])

  useEffect(() => {
    loadProducts()
    loadCompany()
  }, [loadProducts, loadCompany])

  useEffect(() => {
    if (!canDiscount) setDiscountPct(0)
  }, [canDiscount])

  useEffect(() => {
    const permission = VIEW_PERMISSIONS[currentView]
    if (permission && !hasPermission(permission)) {
      setCurrentView('pos')
    }
  }, [currentView, hasPermission])

  const lowStockCount = useMemo(
    () => products.filter((product) => product.stockActual <= product.stockMinimo).length,
    [products],
  )

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return products.filter((product) => {
      const matchesCategory = currentCategory === 'Todos' || product.categoria === currentCategory
      const matchesQuery =
        !query ||
        product.nombre.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        (product.descripcion ?? '').toLowerCase().includes(query)
      return matchesCategory && matchesQuery
    })
  }, [products, currentCategory, searchQuery])

  const addToCart = (productId: number) => {
    const product = products.find((item) => item.id === productId)
    if (!product || product.stockActual <= 0) {
      showToast('Producto sin existencia disponible.')
      return
    }
    setCart((current) => {
      const existing = current.find((item) => item.idProducto === productId)
      if (existing) {
        if (existing.cantidad >= product.stockActual) {
          showToast('Stock máximo alcanzado para este perfume.')
          return current
        }
        return current.map((item) =>
          item.idProducto === productId
            ? { ...item, cantidad: item.cantidad + 1, importe: item.precioUnitario * (item.cantidad + 1) }
            : item,
        )
      }
      showToast(`${product.nombre} agregado al ticket.`)
      const item: CartItem = {
        idProducto: product.id,
        cantidad: 1,
        precioUnitario: product.precioVenta,
        sku: product.sku,
        nombreProducto: product.nombre,
        importe: product.precioVenta,
      }
      return [...current, item]
    })
  }

  const updateQty = (productId: number, delta: number) => {
    setCart((current) => {
      const index = current.findIndex((item) => item.idProducto === productId)
      if (index === -1) return current
      const product = products.find((item) => item.id === productId)
      const quantity = current[index].cantidad + delta
      if (quantity <= 0) return current.filter((item) => item.idProducto !== productId)
      if (quantity > (product?.stockActual ?? 0)) return current
      return current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, cantidad: quantity, importe: item.precioUnitario * quantity } : item,
      )
    })
  }

  const clearCart = () => {
    setCart([])
    setClientName('')
    setDiscountPct(0)
  }

  const calculateTotals = useCallback(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0)
    const discountAmount = subtotal * (discountPct / 100)
    const taxedBase = subtotal - discountAmount
    const tax = taxedBase * (taxRate / 100)
    const total = taxedBase + tax
    return { subtotal, discountAmount, tax, total }
  }, [cart, discountPct, taxRate])

  const openCheckoutModal = () => {
    const { total } = calculateTotals()
    setCashReceived(Math.ceil(total))
    setIsCheckoutOpen(true)
  }

  const completeSale = async () => {
    setSaleBusy(true)
    try {
      const payload = {
        Cliente: clientName || 'CONSUMIDOR FINAL',
        MetodoPago: paymentMethod,
        DescuentoPorcentaje: discountPct,
        EfectivoRecibido: paymentMethod === 'Efectivo' ? cashReceived : undefined,
        Detalles: cart.map((item) => ({
          IdProducto: item.idProducto,
          SKU: item.sku,
          NombreProducto: item.nombreProducto,
          Cantidad: item.cantidad,
          PrecioUnitario: item.precioUnitario,
        })),
      }

      const saleResponse = await saleService.create(payload as any)
      const sale = mapVenta(saleResponse.data as any)
      const invoiceResponse = await saleService.invoice(sale.id)
      const invoice = mapInvoice(invoiceResponse.data as any)

      sessionStorage.setItem('last_invoice', JSON.stringify(invoice))
      setIsCheckoutOpen(false)
      clearCart()
      setIsInvoiceOpen(true)
      await loadProducts()
      showToast('Venta registrada y ticket generado.')
    } catch (error: any) {
      const detail = error?.response?.data?.detail
      showToast(typeof detail === 'string' ? detail : 'Error al procesar la venta.')
      console.error(error)
    } finally {
      setSaleBusy(false)
    }
  }

  const openInvoicePreview = useCallback(async (saleId: number) => {
    try {
      const response = await saleService.invoice(saleId)
      sessionStorage.setItem('last_invoice', JSON.stringify(mapInvoice(response.data as any)))
      setIsInvoiceOpen(true)
    } catch {
      showToast('No se pudo cargar la factura para imprimir.')
    }
  }, [showToast])

  const calculateChange = () => Math.max(0, cashReceived - calculateTotals().total)

  const openProductDetail = (productId: number) => {
    const product = products.find((item) => item.id === productId)
    if (product) {
      setDetailProduct(product)
      setIsDetailOpen(true)
    }
  }

  const updateProduct = async (productId: number, data: Partial<Producto>) => {
    try {
      const response = await productService.update(productId, data)
      const updated = mapProducto(response.data as any)
      setProducts((current) => current.map((item) => (item.id === productId ? updated : item)))
      setDetailProduct(updated)
      showToast('Producto actualizado.')
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'No se pudo actualizar el producto.')
      throw error
    }
  }

  const deleteProduct = async (product: Producto) => {
    try {
      await productService.remove(product.id)
      setProducts((current) => current.filter((item) => item.id !== product.id))
      if (detailProduct?.id === product.id) setIsDetailOpen(false)
      showToast('Producto desactivado del catálogo.')
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'No se pudo desactivar el producto.')
    }
  }

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    setLoginBusy(true)
    setLoginError('')
    try {
      await login({ email: loginEmail.trim().toLowerCase(), password: loginPassword })
    } catch (error: any) {
      setLoginError(error?.response?.data?.detail || 'No se pudo conectar con el servidor. Verifica que el backend esté activo.')
    } finally {
      setLoginBusy(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-noir-950 text-champagne-200 text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando sesión...
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-noir-950 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(223,194,138,0.16),_transparent_45%)]" />
        <button
          onClick={toggleTheme}
          className="absolute top-5 right-5 p-2.5 rounded-xl bg-noir-900 border border-noir-800 text-champagne-300 hover:bg-noir-800"
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <form onSubmit={handleLogin} className="relative w-full max-w-sm bg-white rounded-3xl p-7 shadow-2xl space-y-5 border border-champagne-200">
          <div className="text-center">
            <img src="/logo.jpeg" alt="Nurfa Essencial" className="w-20 h-20 rounded-full object-cover mx-auto ring-2 ring-champagne-300 shadow-lg" />
            <h1 className="font-serif text-2xl font-bold text-noir-950 mt-3 tracking-[0.12em]">NURFA ESSENCIAL</h1>
            <p className="text-[10px] uppercase tracking-[0.35em] text-champagne-700 mt-1">Perfumería</p>
            <p className="text-xs text-slate-500 mt-3">Punto de venta y administración boutique</p>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Correo</label>
            <input
              type="email"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              className="mt-1 w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-noir-800"
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Contraseña</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              className="mt-1 w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-noir-800"
              placeholder="••••••••"
              required
            />
          </div>
          {loginError && <p className="text-xs text-rose-600">{loginError}</p>}
          <button
            type="submit"
            disabled={loginBusy}
            className="w-full py-3 rounded-xl bg-noir-950 hover:bg-noir-800 text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loginBusy && <Loader2 className="w-4 h-4 animate-spin" />}
            {loginBusy ? 'Entrando...' : 'Entrar al sistema'}
          </button>
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            Admin: admin@nurfaessencial.com · Admin123!
            <br />
            Cajero: caja1@nurfaessencial.com · Admin123!
          </p>
        </form>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col overflow-hidden relative h-screen">
        <Toast message={toast.message} visible={toast.visible} onClose={() => setToast((current) => ({ ...current, visible: false }))} />
        <Header />

        <div className="flex-1 flex overflow-hidden relative">
          <Sidebar currentView={currentView} setCurrentView={(key) => setCurrentView(key as ViewName)} lowStockCount={lowStockCount} />

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
                  openProductDetail={openProductDetail}
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
                  taxRate={taxRate}
                  canDiscount={canDiscount}
                />
              </>
            )}

            {currentView === 'caja' && <CajaView showToast={showToast} />}

            {currentView === 'inventario' && (
              <InventarioView
                products={products}
                canCreate={canEditProducts}
                canEdit={canEditProducts}
                canViewCost={canViewCost}
                openNewProductModal={() => setIsNewProductOpen(true)}
                openProductDetail={openProductDetail}
                onDelete={deleteProduct}
              />
            )}

            {currentView === 'facturas' && hasPermission('factura.editar') && (
              <FacturasView products={products} taxRate={taxRate} showToast={showToast} onPreview={openInvoicePreview} />
            )}

            {currentView === 'contabilidad' && hasPermission('contabilidad.ver') && (
              <ContabilidadView products={products} taxRate={taxRate} showToast={showToast} />
            )}

            {currentView === 'usuarios' && hasPermission('usuarios.gestionar') && <UsuariosView showToast={showToast} />}

            {currentView === 'configuracion' && hasPermission('factura.configurar') && (
              <ConfiguracionView showToast={showToast} onCompanyUpdated={setCompany} />
            )}

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
              isProcessing={saleBusy}
            />

            <InvoicePreviewModal isOpen={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} />

            <ProductDetailModal
              isOpen={isDetailOpen}
              product={detailProduct}
              onClose={() => setIsDetailOpen(false)}
              canEdit={canEditProducts}
              canViewCost={canViewCost}
              onUpdate={updateProduct}
              onAddToCart={(id) => {
                addToCart(id)
                setIsDetailOpen(false)
              }}
            />

            <NewProductModal
              isOpen={isNewProductOpen}
              onClose={() => setIsNewProductOpen(false)}
              canCreate={canEditProducts}
              onSave={async (newProduct) => {
                try {
                  const response = await productService.create({
                    SKU: newProduct.sku,
                    Nombre: newProduct.name,
                    Descripcion: newProduct.description,
                    Categoria: newProduct.category,
                    Costo: newProduct.cost,
                    PrecioVenta: newProduct.price,
                    StockActual: newProduct.stock,
                    StockMinimo: newProduct.minStock,
                    ImagenUrl: newProduct.image,
                    Activo: true,
                  } as any)
                  const saved = mapProducto(response.data as any)
                  setProducts((current) => [saved, ...current])
                  setIsNewProductOpen(false)
                  showToast('Perfume registrado en el catálogo.')
                } catch (error: any) {
                  showToast(error?.response?.data?.detail || 'No se pudo guardar el perfume.')
                  throw error
                }
              }}
            />
          </main>
        </div>
      </div>
    </>
  )
}

export default App
