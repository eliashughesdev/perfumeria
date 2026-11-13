import { Camera, Upload, X } from 'lucide-react'

interface NewProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newProduct: any) => void
  isAdmin: boolean
}

export function NewProductModal({ isOpen, onClose, onSave, isAdmin }: NewProductModalProps) {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Damas')
  const [stock, setStock] = useState('10')
  const [cost, setCost] = useState('85')
  const [price, setPrice] = useState('165')

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhotoDataUrl(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newProd = {
      id: Date.now(),
      sku: `PRF-${String(Date.now()).slice(-3)}`,
      name,
      description,
      category,
      cost: parseFloat(cost),
      price: parseFloat(price),
      stock: parseInt(stock),
      image: photoDataUrl,
      color: 'from-plum-100 to-plum-200',
      bottle: 'text-plum-800',
    }
    onSave(newProd)
    setName('')
    setDescription('')
    setCategory('Damas')
    setStock('10')
    setCost('85')
    setPrice('165')
    setPhotoDataUrl(null)
  }

  if (!isAdmin) return null

  return (
    <div
      id="new-product-modal"
      className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 ${isOpen ? 'flex items-center justify-center p-4 no-print' : 'hidden no-print'}`}
    >
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        <div className="bg-plum-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-base">Registrar Nueva Fragancia</h3>
          <button onClick={onClose} className="text-plum-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs overflow-y-auto max-h-[60vh]">
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
                <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-plum-50 text-plum-900 border border-plum-200 font-semibold hover:bg-plum-100 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Seleccionar Imagen</span>
                  <input type="file" id="np-photo-input" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
                <p className="text-[10px] text-slate-400">Soporta JPG, PNG o WEBP. Ideal formato cuadrado.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nombre del Perfume</label>
            <input
              type="text"
              id="np-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej. Baccarat Rouge 540 70ml"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-plum-800"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Descripción y Notas Olfativas</label>
            <textarea
              id="np-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              required
              placeholder="Ej. Notas de azafrán, jazmín, madera de cedro y ámbar gris. Alta duración."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-plum-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Categoría</label>
              <select id="np-cat" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl">
                <option value="Damas">Damas</option>
                <option value="Caballeros">Caballeros</option>
                <option value="Unisex">Unisex</option>
                <option value="Nicho">Árabes / Nicho</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Stock Inicial</label>
              <input type="number" id="np-stock" value={parseInt(stock) || 10} onChange={(e) => setStock(e.target.value)} required min="1" className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Costo Compra ($)</label>
              <input type="number" id="np-cost" value={cost} onChange={(e) => setCost(e.target.value)} required step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Precio Venta ($)</label>
              <input type="number" id="np-price" value={price} onChange={(e) => setPrice(e.target.value)} required step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded-xl" />
            </div>
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-plum-900 hover:bg-plum-800 text-white font-bold text-sm mt-2 transition">
            Guardar en Catálogo
          </button>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
