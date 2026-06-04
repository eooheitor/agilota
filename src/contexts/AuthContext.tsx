import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { apiFetch } from '../lib/api'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  register: (name: string, email: string, password: string, role: string) => Promise<{ error: string | null }>
  updateProfile: (data: { name?: string; current_password?: string; new_password?: string }) => Promise<{ error: string | null }>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('auth_token')) { setLoading(false); return }
    apiFetch<User>('/auth/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('auth_token'))
      .finally(() => setLoading(false))
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { token, user } = await apiFetch<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      localStorage.setItem('auth_token', token)
      setUser(user)
      return { error: null }
    } catch (err) {
      return { error: (err as Error).message }
    }
  }

  const register = async (name: string, email: string, password: string, role: string) => {
    try {
      const { token, user } = await apiFetch<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      })
      localStorage.setItem('auth_token', token)
      setUser(user)
      return { error: null }
    } catch (err) {
      return { error: (err as Error).message }
    }
  }

  const updateProfile = async (data: { name?: string; current_password?: string; new_password?: string }) => {
    try {
      const { user: updated, token } = await apiFetch<{ user: User; token: string }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      localStorage.setItem('auth_token', token)
      setUser(updated)
      return { error: null }
    } catch (err) {
      return { error: (err as Error).message }
    }
  }

  const signOut = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, register, updateProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
