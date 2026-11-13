import { ShieldCheck } from 'lucide-react'
interface UsuariosViewProps {
  isAdmin: boolean
  showToast: (msg: string) => void
}

export function UsuariosView({ isAdmin, showToast }: UsuariosViewProps) {
  if (!isAdmin) {
    showToast('Acceso denegado: Se requiere rol de Administrador (RBAC).')
    return null
  }

  const usuarios = [
    { nombre: 'Ana Gómez (Dueña)', email: 'ana@lessence.com', avatar: 'AG', rol: 'ROLE_ADMIN', rolLabel: 'Administrador', color: 'bg-plum-100 text-plum-900' },
    { nombre: 'Carlos Méndez', email: 'caja1@lessence.com', avatar: 'CM', rol: 'ROLE_CAJERO', rolLabel: 'Cajero', color: 'bg-amber-100 text-amber-800' },
  ]

  return (
    <section id="view-usuarios" className="view-section hidden flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Control de Usuarios y Seguridad RBAC</h2>
        <p className="text-xs text-slate-500">Administración de roles, tokens JWT y matriz de permisos del sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-800">Personal Autorizado</h3>
          <div className="space-y-3">
            {usuarios.map((u) => (
              <div key={u.email} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-plum-900 text-gold-400 flex items-center justify-center font-bold text-xs">{u.avatar}</div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{u.nombre}</p>
                    <p className="text-[11px] text-slate-500">{u.email}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${u.color}`}>{u.rol}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 mb-3">Matriz de Permisos (RBAC)</h3>
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-2">Módulo / Acción</th>
                <th className="py-2 text-center">Admin</th>
                <th className="py-2 text-center">Cajero</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 font-medium">Facturar en POS</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium">Apertura y Cierre de Caja</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium">Ver Costos y Márgenes</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-rose-500 font-bold">✕</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium">Crear / Eliminar Productos</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-rose-500 font-bold">✕</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium">Contabilidad y Usuarios</td>
                <td className="py-2.5 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 text-center text-rose-500 font-bold">✕</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
