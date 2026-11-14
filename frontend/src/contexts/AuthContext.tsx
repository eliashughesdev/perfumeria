import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '@/services/api'
import { mapUsuario } from '@/services/mappers'
import type { LoginRequest, PermisoClave, RolUsuario, TokenData, Usuario } from '@/types'

interface AuthContextType {
  token: string | null
  usuario: Usuario | null
  login: (data: LoginRequest) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
  hasRole: (rol: RolUsuario) => boolean
  hasPermission: (permiso: PermisoClave) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const TOKEN_KEY = 'lessence_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY)
    }
    return null
  })
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setUsuario(null)
      setIsLoading(false)
      return
    }

    let active = true
    setIsLoading(true)
    authService
      .me()
      .then((response) => {
        if (active) setUsuario(mapUsuario(response.data))
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        if (active) {
          setToken(null)
          setUsuario(null)
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [token])

  const hasRole = (rol: RolUsuario): boolean => usuario?.rol === rol

  const hasPermission = (permiso: PermisoClave): boolean => {
    if (!usuario) return false
    if (usuario.rol === 'ROLE_ADMIN') return true
    return usuario.permisos.includes(permiso)
  }

  const login = async (data: LoginRequest) => {
    const response = await authService.login(data)
    const result: TokenData = response.data
    localStorage.setItem(TOKEN_KEY, result.access_token)
    setToken(result.access_token)
    setUsuario({
      id: 0,
      nombre: result.nombre,
      email: result.email,
      rol: result.rol,
      activo: true,
      permisos: result.permisos ?? [],
    })
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUsuario(null)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider
      value={{ token, usuario, login, logout, isLoading, isAuthenticated: !!token, hasRole, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
