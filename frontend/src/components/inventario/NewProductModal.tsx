import { useState } from 'react'
import { Camera, Upload, X, Loader2 } from 'lucide-react'

interface NewProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newProduct: {
    sku: string
    name: string
    description: string
    category: string
    cost: number
    price: number
    stock: number
    minStock: number
    image: string | null
  }) => Promise<void>
  canCreate: boolean
}

export function NewProductModal({ isOpen, onClose, onSave, canCreate }: NewProductModalProps) {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Damas')
  const [sku, setSku] = useState('')
  const [stock, setStock] = useState('10')
  const [minStock, setMinStock] = useState('4')
  const [cost, setCost] = useState('85')
  const [price, setPrice] = useState('165')
  const [saving, setSaving] = useState(false)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 900_000) {
      setPhotoDataUrl(null)
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoDataUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const reset = () => {
    setName('')
    setDescription('')
    setCategory('Damas')
    setSku('')
    setStock('10')
    setMinStock('4')
    setCost('85')
    setPrice('165')
    setPhotoDataUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        sku: sku.trim() || `NUR-${String(Date.now()).slice(-6)}`,
        name: name.trim(),
        description: description.trim(),
        category,
        cost: parseFloat(cost) || 0,
        price: parseFloat(price) || 0,
        stock: parseInt(stock) || 0,
        minStock: parseInt(minStock) || 0,
        image: photoDataUrl,
      })
      reset()
    } finally {
      setSaving(false)
    }
  }

  if (!canCreate) return null

  return (
    <div
      id="new-product-modal"
      className={`fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 ${isOpen ? 'flex items-center justify-center p-4 no-print' : 'hidden no-print'}`}
    >
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl max-h-[94vh] flex flex-col">
        <div className="bg-noir-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-base">Registrar Nueva Fragancia</h3>
          <button onClick={onClose} className="text-noir-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs overflow-y-auto">
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">Fotografía del Perfume</label>
            <div className="flex items-center gap-3.5">
              <div
                id="np-photo-preview"
                className={`w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 overflow-hidden shrink-0 ${photoDataUrl ? 'bg-transparent border-transparent' : ''}`}
              >
                {photoDataUrl ? (
                  <img src={photoDataUrl} alt="Vista previa" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 mb-0.5" />
                    <span className="text-[9px]">Vista previa</span>
                  </>
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-champagne-50 text-noir-900 border border-champagne-200 font-semibold hover:bg-champagne-100 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Seleccionar Imagen</span>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
                <p className="text-[10px] text-slate-400">JPG, PNG o WEBP. Máximo 900 KB. Formato cuadrado recomendado.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nombre del Perfume</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ej. Baccarat Rouge 540 70ml"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-noir-800"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">SKU / Código</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="NUR-000123"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-noir-800"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Descripción y Notas Olfativas</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              required
              placeholder="Ej. Notas de azafrán, jazmín, madera de cedro y ámbar gris. Alta duración."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-noir-800"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Categoría</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl">
                <option value="Damas">Damas</option>
                <option value="Caballeros">Caballeros</option>
                <option value="Unisex">Unisex</option>
                <option value="Nicho">Árabes / Nicho</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Stock Inicial</label>
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required min="0" className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Stock Mínimo</label>
              <input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} required min="0" className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Costo Compra ($)</label>
              <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} required step="0.01" min="0" className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Precio Venta ($)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required step="0.01" min="0" className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-noir-950 hover:bg-noir-800 disabled:opacity-60 text-white font-bold text-sm mt-2 transition flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Guardando...' : 'Guardar en Catálogo'}
          </button>
        </form>
      </div>
    </div>
  )
}
