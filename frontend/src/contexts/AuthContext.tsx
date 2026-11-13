import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Usuario, TokenData, LoginRequest } from '@/types'

interface AuthContextType {
  token: string | null
  usuario: Usuario | null
  login: (data: LoginRequest) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
  hasRole: (rol: RolUsuario) => boolean
}

type RolUsuario = 'ROLE_ADMIN' | 'ROLE_CAJERO'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lessence_token')
    }
    return null
  })
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8050'

  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((u) => setUsuario(u))
        .catch(() => {
          localStorage.removeItem('lessence_token')
          setToken(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [token])

  const hasRole = (rol: RolUsuario): boolean => {
    return usuario?.rol === rol
  }

  const login = async (data: LoginRequest) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Credenciales inválidas')
    const result: TokenData = await res.json()
    localStorage.setItem('lessence_token', result.access_token)
    setToken(result.access_token)
    setUsuario({ id: 0, nombre: result.nombre, email: result.email, rol: result.rol, activo: true })
  }

  const logout = () => {
    localStorage.removeItem('lessence_token')
    setToken(null)
    setUsuario(null)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ token, usuario, login, logout, isLoading, isAuthenticated: !!token, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
