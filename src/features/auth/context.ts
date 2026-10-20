import { createContext } from 'react'
import type { AdminProfile, AuthError, AuthStatus, AuthUser } from './types'

export interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  admin: AdminProfile | null
  error: AuthError | null
  login: (email: string, password: string) => Promise<AuthError | null>
  logout: () => Promise<void>
  clearError: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
