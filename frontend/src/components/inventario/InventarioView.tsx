import { useMemo, useState } from 'react'
import { Plus, Edit, Trash2, Search, PackageSearch, AlertTriangle } from 'lucide-react'
import type { Producto } from '@/types'

interface InventarioViewProps {
  products: Producto[]
  canCreate: boolean
  canEdit: boolean
  canViewCost: boolean
  openNewProductModal: () => void
  openProductDetail: (id: number) => void
  onDelete: (product: Producto) => void
}

export function InventarioView({
  products,
  canCreate,
  canEdit,
  canViewCost,
  openNewProductModal,
  openProductDetail,
  onDelete,
}: InventarioViewProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')

  const categories = useMemo(() => ['Todas', ...Array.from(new Set(products.map((p) => p.categoria)))], [products])

  const filtered = products.filter((product) => {
    const search = query.trim().toLowerCase()
    const matchesSearch =
      !search ||
      product.nombre.toLowerCase().includes(search) ||
      product.sku.toLowerCase().includes(search) ||
      (product.descripcion ?? '').toLowerCase().includes(search)
    const matchesCategory = category === 'Todas' || product.categoria === category
    return matchesSearch && matchesCategory
  })

  const lowStock = products.filter((p) => p.stockActual <= p.stockMinimo).length
  const inventoryCost = products.reduce((sum, p) => sum + (p.costo ?? 0) * p.stockActual, 0)
  const inventoryValue = products.reduce((sum, p) => sum + p.precioVenta * p.stockActual, 0)

  return (
    <section id="view-inventario" className="view-section flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Inventario de Fragancias</h2>
          <p className="text-xs text-slate-500">Existencias, costos, precios y alertas de reposición</p>
        </div>
        <button
          onClick={openNewProductModal}
          disabled={!canCreate}
          className={`px-4 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center gap-2 shadow-sm self-start transition ${canCreate ? 'bg-noir-950 hover:bg-noir-800' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
          title={canCreate ? 'Registrar producto' : 'Sin permiso para crear productos'}
        >
          <Plus className="w-4 h-4 text-champagne-400" /> Nuevo Perfume
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] text-slate-500 font-medium">Referencias</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{products.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] text-slate-500 font-medium">Unidades en stock</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{products.reduce((sum, p) => sum + p.stockActual, 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] text-slate-500 font-medium">{canViewCost ? 'Valor a costo' : 'Valor a venta'}</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">${(canViewCost ? inventoryCost : inventoryValue).toFixed(2)}</p>
        </div>
        <div className={`p-4 rounded-2xl border shadow-sm ${lowStock > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
          <p className="text-[11px] text-slate-500 font-medium">Stock bajo</p>
          <p className={`text-xl font-bold mt-0.5 ${lowStock > 0 ? 'text-amber-700' : 'text-slate-800'}`}>{lowStock}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, SKU o descripción..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-noir-800"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100 text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Producto</th>
                <th className="px-5 py-3.5">Categoría</th>
                <th className="px-5 py-3.5">SKU</th>
                {canViewCost && <th className="px-5 py-3.5">Costo</th>}
                <th className="px-5 py-3.5">Precio</th>
                <th className="px-5 py-3.5">Stock</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canViewCost ? 8 : 7} className="px-5 py-10 text-center text-slate-400">
                    <PackageSearch className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No hay productos para mostrar.
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const isLow = product.stockActual <= product.stockMinimo
                  return (
                    <tr key={product.id} className="hover:bg-champagne-50/40 transition">
                      <td className="px-5 py-3.5">
                        <button onClick={() => openProductDetail(product.id)} className="flex items-center gap-3 text-left">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-champagne-100 to-champagne-200 flex items-center justify-center shrink-0">
                            {product.imagenesUrls?.split(",")[0] ? (
                              <img src={product.imagenesUrls?.split(",")[0]} alt={product.nombre} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-serif text-[8px] font-bold text-noir-800">NURFA</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate max-w-[220px]">{product.nombre}</p>
                            <p className="text-[11px] text-slate-400 line-clamp-1 max-w-[220px]">{product.descripcion || ''}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{product.categoria}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-500">{product.sku}</td>
                      {canViewCost && <td className="px-5 py-3.5 text-slate-500">${(product.costo ?? 0).toFixed(2)}</td>}
                      <td className="px-5 py-3.5 font-bold text-noir-900">${product.precioVenta.toFixed(2)}</td>
                      <td className="px-5 py-3.5 font-bold">{product.stockActual} uds.</td>
                      <td className="px-5 py-3.5">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                            <AlertTriangle className="w-3 h-3" /> Stock bajo
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">Disponible</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openProductDetail(product.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                            title={canEdit ? 'Ver / editar ficha' : 'Ver ficha'}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => {
                                if (confirm(`¿Desactivar ${product.nombre} del catálogo?`)) onDelete(product)
                              }}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                              title="Desactivar producto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
