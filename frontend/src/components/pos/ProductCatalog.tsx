import { Search, Plus } from 'lucide-react'

interface ProductCatalogProps {
  products: any[]
  currentCategory: string
  setCurrentCategory: (cat: string) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  addToCart: (id: number) => void
}

export function ProductCatalog({ products, currentCategory, setCurrentCategory, searchQuery, setSearchQuery, addToCart }: ProductCatalogProps) {
  const categories = ['Todos', 'Damas', 'Caballeros', 'Unisex', 'Nicho']

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 lg:p-5">
      <div className="flex flex-col sm:flex-row gap-3 mb-4 shrink-0">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="pos-search"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar perfume, marca o escanear código de barras..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-plum-800 shadow-sm"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0" id="category-filters">
          {categories.map((cat) => {
            const isMatch = (currentCategory === 'Nicho' && cat.includes('Nicho')) || cat === currentCategory
            return (
              <button
                key={cat}
                onClick={() => setCurrentCategory(cat)}
                className={`cat-btn px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shadow-sm transition ${isMatch ? 'bg-plum-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      <div id="pos-product-grid" className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 pr-1 pb-20 lg:pb-4 content-start">
        {products.map((p) => {
          const lowStock = p.stockActual <= 4
          const color = p.imagenUrl
            ? ''
            : `from-plum-100 to-plum-200`
          const bottle = 'text-plum-800'

          return (
            <div
              key={p.id}
              onClick={() => addToCart(p.id)}
              className="group bg-white rounded-2xl border border-slate-200/90 p-3 flex flex-col justify-between cursor-pointer hover:border-plum-800 hover:shadow-md transition relative overflow-hidden"
            >
              {lowStock && (
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold z-10 shadow-xs">
                  Quedan {p.stockActual}
                </span>
              )}

              {p.imagenUrl ? (
                <div className="h-28 rounded-xl mb-3 overflow-hidden bg-slate-100 relative">
                  <img src={p.imagenUrl} alt={p.nombre} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                </div>
              ) : (
                <div className={`h-28 rounded-xl bg-gradient-to-br ${color} mb-3 flex flex-col items-center justify-center relative overflow-hidden`}>
                  <div className="w-4 h-2.5 bg-gold-400 rounded-t-sm"></div>
                  <div className="w-11 h-14 rounded-lg bg-white/20 backdrop-blur-xs border border-white/40 flex items-center justify-center shadow-inner group-hover:scale-105 transition">
                    <span className={`font-serif text-[10px] font-bold tracking-widest uppercase ${bottle}`}>EAU</span>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{p.categoria}</span>
                  <span className="text-[10px] text-plum-700 font-medium opacity-0 group-hover:opacity-100 transition">Ver ficha</span>
                </div>
                <h3 className="font-bold text-xs text-slate-800 line-clamp-1 mt-0.5 leading-snug">{p.nombre}</h3>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{p.descripcion || 'Sin descripción'}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="font-bold text-sm text-plum-900">${p.precioVenta.toFixed(2)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    addToCart(p.id)
                  }}
                  className="w-8 h-8 rounded-lg bg-plum-50 text-plum-900 hover:bg-plum-900 hover:text-white flex items-center justify-center transition shadow-2xs"
                  title="Agregar directo a factura"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
