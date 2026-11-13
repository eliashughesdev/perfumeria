import { Plus, ShieldCheck, Edit, Trash2 } from 'lucide-react'
import { useEffect } from 'react'

interface InventarioViewProps {
  products: any[]
  setProducts: (products: any[]) => void
  isAdmin: boolean
  setLowStockCount: (count: number) => void
  openNewProductModal: () => void
  openProductDetail: (id: number) => void
}

export function InventarioView({ products, setProducts, isAdmin, setLowStockCount, openNewProductModal, openProductDetail }: InventarioViewProps) {
  const lowStock = products.filter((p) => p.stockActual <= 4).length

  useEffect(() => {
    setLowStockCount(lowStock)
  }, [lowStock, setLowStockCount])

  return (
    <section id="view-inventario" className="view-section flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Inventario de Fragancias</h2>
          <p className="text-xs text-slate-500">Control de existencias, costos, precios de venta y alertas de reposición</p>
        </div>
        <button
          onClick={openNewProductModal}
          disabled={!isAdmin}
          className={`px-4 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center gap-2 shadow-sm self-start transition ${isAdmin ? 'bg-plum-900 hover:bg-plum-800' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
        >
          <Plus className="w-4 h-4 text-gold-400" /> Nuevo Perfume
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Producto</th>
                <th className="px-5 py-3.5">Categoría</th>
                <th className="px-5 py-3.5">SKU / Código</th>
                {isAdmin && <th className="px-5 py-3.5">Costo</th>}
                <th className="px-5 py-3.5">Precio Venta</th>
                <th className="px-5 py-3.5">Stock Actual</th>
                <th className="px-5 py-3.5 text-right">Estado</th>
              </tr>
            </thead>
            <tbody id="inventory-table-body" className="divide-y divide-slate-100">
              {products.map((p) => {
                return (
                  <tr
                    key={p.id}
                    onClick={() => openProductDetail(p.id)}
                    className="hover:bg-plum-50/50 cursor-pointer transition"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-plum-100 to-plum-200 flex items-center justify-center shrink-0">
                          <span className="font-serif text-[8px] font-bold text-plum-800">EAU</span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{p.nombre}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{p.descripcion || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{p.categoria}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">{p.sku}</td>
                    {isAdmin && (
                      <td className="px-5 py-3.5 text-slate-500">${Number(p.costo ?? 0).toFixed(2)}</td>
                    )}
                    <td className="px-5 py-3.5 font-bold text-plum-900">${p.precioVenta.toFixed(2)}</td>
                    <td className="px-5 py-3.5 font-bold">{p.stockActual} uds.</td>
                    <td className="px-5 py-3.5 text-right">
                      {p.stockActual <= 4 ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">Stock Bajo</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">Disponible</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fixed top-20 right-5 z-[50] hidden sm:flex">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${lowStock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {lowStock > 0 ? `${lowStock} stock bajo` : 'Sin alertas de stock'}
        </span>
      </div>
    </section>
  )
}
