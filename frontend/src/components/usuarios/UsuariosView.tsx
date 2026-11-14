import { useEffect, useMemo, useState } from 'react'
import { UserPlus, Pencil, UserX, ShieldCheck, Loader2, X, Save, KeyRound } from 'lucide-react'
import { userService } from '@/services/api'
import { mapUsuario } from '@/services/mappers'
import { useAuth } from '@/contexts/AuthContext'
import type { CatalogoPermisos, PermisoClave, RolUsuario, Usuario } from '@/types'

interface UsuariosViewProps {
  showToast: (msg: string) => void
}

interface UserForm {
  nombre: string
  email: string
  password: string
  rol: RolUsuario
  activo: boolean
  permisos: PermisoClave[]
}

const emptyForm = (): UserForm => ({
  nombre: '',
  email: '',
  password: '',
  rol: 'ROLE_CAJERO',
  activo: true,
  permisos: [],
})

export function UsuariosView({ showToast }: UsuariosViewProps) {
  const { usuario: currentUser } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [catalog, setCatalog] = useState<CatalogoPermisos | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Usuario | null>(null)
  const [form, setForm] = useState<UserForm>(emptyForm())

  const load = async () => {
    const [usersResponse, permissionsResponse] = await Promise.all([userService.list(), userService.permissions()])
    setUsuarios((usersResponse.data as any[]).map(mapUsuario))
    setCatalog(permissionsResponse.data)
  }

  useEffect(() => {
    load()
      .catch(() => showToast('No se pudieron cargar los usuarios.'))
      .finally(() => setLoading(false))
  }, [showToast])

  const groupedPermissions = useMemo(() => {
    if (!catalog) return [] as Array<[string, { clave: PermisoClave; etiqueta: string }[]]>
    const groups = new Map<string, { clave: PermisoClave; etiqueta: string }[]>()
    for (const permission of catalog.permisos) {
      const list = groups.get(permission.grupo) ?? []
      list.push({ clave: permission.clave, etiqueta: permission.etiqueta })
      groups.set(permission.grupo, list)
    }
    return Array.from(groups.entries())
  }, [catalog])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm(), permisos: catalog?.por_rol.ROLE_CAJERO ?? [] })
    setModalOpen(true)
  }

  const openEdit = (user: Usuario) => {
    setEditing(user)
    setForm({
      nombre: user.nombre,
      email: user.email,
      password: '',
      rol: user.rol,
      activo: user.activo,
      permisos: [...user.permisos],
    })
    setModalOpen(true)
  }

  const changeRole = (rol: RolUsuario) => {
    const defaults = catalog?.por_rol[rol] ?? []
    setForm((current) => ({ ...current, rol, permisos: rol === 'ROLE_ADMIN' ? defaults : [...defaults] }))
  }

  const togglePermission = (permission: PermisoClave) => {
    if (form.rol === 'ROLE_ADMIN') return
    setForm((current) => ({
      ...current,
      permisos: current.permisos.includes(permission)
        ? current.permisos.filter((item) => item !== permission)
        : [...current.permisos, permission],
    }))
  }

  const save = async () => {
    if (!form.nombre.trim() || !form.email.trim()) {
      showToast('Nombre y correo son obligatorios.')
      return
    }
    if (!editing && form.password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await userService.update(editing.id, {
          Nombre: form.nombre.trim(),
          Email: form.email.trim(),
          Rol: form.rol,
          Activo: form.activo,
          Permisos: form.rol === 'ROLE_ADMIN' ? undefined : form.permisos,
          ...(form.password ? { Password: form.password } : {}),
        } as any)
        showToast('Usuario actualizado.')
      } else {
        await userService.create({
          Nombre: form.nombre.trim(),
          Email: form.email.trim(),
          Password: form.password,
          Rol: form.rol,
          Activo: form.activo,
          Permisos: form.rol === 'ROLE_ADMIN' ? undefined : form.permisos,
        } as any)
        showToast('Usuario creado y permisos asignados.')
      }
      setModalOpen(false)
      await load()
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'No se pudo guardar el usuario.')
    } finally {
      setSaving(false)
    }
  }

  const deactivate = async (user: Usuario) => {
    if (!confirm(`¿Desactivar el acceso de ${user.nombre}?`)) return
    try {
      await userService.remove(user.id)
      showToast('Usuario desactivado.')
      await load()
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'No se pudo desactivar el usuario.')
    }
  }

  return (
    <section id="view-usuarios" className="view-section flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Usuarios y Seguridad RBAC</h2>
          <p className="text-xs text-slate-500">Crea usuarios y define exactamente qué módulos puede usar cada persona</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2.5 rounded-xl bg-noir-950 hover:bg-noir-800 text-white text-xs font-semibold flex items-center gap-2 self-start"
        >
          <UserPlus className="w-4 h-4 text-champagne-400" /> Nuevo usuario
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-champagne-600" /> Personal autorizado
            </h3>
            <span className="text-[11px] text-slate-500">{usuarios.filter((u) => u.activo).length} activos</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Cargando usuarios...
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {usuarios.map((user) => (
                <div key={user.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${user.rol === 'ROLE_ADMIN' ? 'bg-noir-950 text-champagne-300' : 'bg-champagne-100 text-champagne-800'}`}>
                      {user.nombre.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-800 truncate">{user.nombre}</p>
                        {!user.activo && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold">INACTIVO</span>}
                        {user.id === currentUser?.id && <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold">TÚ</span>}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {user.rol === 'ROLE_ADMIN' ? 'Acceso total' : `${user.permisos.length} permisos asignados`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => openEdit(user)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" title="Editar usuario y permisos">
                      <Pencil className="w-4 h-4" />
                    </button>
                    {user.id !== currentUser?.id && user.activo && (
                      <button onClick={() => deactivate(user)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50" title="Desactivar usuario">
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-sm text-slate-800 mb-1">Matriz de permisos</h3>
          <p className="text-[11px] text-slate-500 mb-4">Referencia rápida de roles base del sistema.</p>
          <div className="space-y-4">
            {groupedPermissions.map(([group, permissions]) => (
              <div key={group}>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">{group}</p>
                <div className="space-y-1">
                  {permissions.map((permission) => (
                    <div key={permission.clave} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600">{permission.etiqueta}</span>
                      <span className="flex gap-3 shrink-0">
                        <span className="text-emerald-600 font-bold">A</span>
                        <span className={catalog?.por_rol.ROLE_CAJERO.includes(permission.clave) ? 'text-emerald-600 font-bold' : 'text-slate-300 font-bold'}>C</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-4">A = Administradora · C = Cajero base</p>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[94vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-noir-950 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-champagne-400" />
                {editing ? 'Editar usuario y permisos' : 'Nuevo usuario'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-noir-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nombre completo</label>
                  <input className="w-full px-3 py-2.5 border border-slate-300 rounded-xl" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Correo</label>
                  <input type="email" className="w-full px-3 py-2.5 border border-slate-300 rounded-xl" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Rol</label>
                  <select className="w-full px-3 py-2.5 border border-slate-300 rounded-xl" value={form.rol} onChange={(e) => changeRole(e.target.value as RolUsuario)}>
                    <option value="ROLE_CAJERO">Cajero</option>
                    <option value="ROLE_ADMIN">Administradora</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{editing ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
                  <input type="password" className="w-full px-3 py-2.5 border border-slate-300 rounded-xl" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'} />
                </div>
              </div>

              <label className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
                <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} className="accent-noir-900" />
                Usuario activo (puede iniciar sesión)
              </label>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Permisos granulares</p>
                  {form.rol === 'ROLE_ADMIN' && <span className="text-[10px] text-champagne-700 font-semibold">La administradora conserva todos los permisos</span>}
                </div>
                <div className="grid sm:grid-cols-2 gap-1.5">
                  {catalog?.permisos.map((permission) => {
                    const checked = form.rol === 'ROLE_ADMIN' || form.permisos.includes(permission.clave)
                    return (
                      <label
                        key={permission.clave}
                        className={`flex items-start gap-2 px-3 py-2 rounded-xl border text-[11px] cursor-pointer transition ${
                          checked ? 'bg-champagne-50 border-champagne-300 text-noir-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={form.rol === 'ROLE_ADMIN'}
                          onChange={() => togglePermission(permission.clave)}
                          className="mt-0.5 accent-noir-900"
                        />
                        <span>
                          <span className="font-semibold block">{permission.etiqueta}</span>
                          <span className="text-[10px] text-slate-400">{permission.grupo}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex gap-2 shrink-0">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600">
                Cancelar
              </button>
              <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-noir-950 hover:bg-noir-800 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editing ? 'Guardar cambios' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
