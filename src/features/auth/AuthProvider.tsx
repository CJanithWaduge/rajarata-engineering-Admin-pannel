import { onAuthStateChanged } from 'firebase/auth'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { auth } from '../../lib/firebase'
import { fetchAdminProfile, signInAdmin, signOutAdmin } from './authService'
import { AuthContext } from './context'
import { notAdminError, toAuthError } from './errors'
import type { AdminProfile, AuthError, AuthStatus, AuthUser } from './types'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [admin, setAdmin] = useState<AdminProfile | null>(null)
  const [error, setError] = useState<AuthError | null>(null)

  useEffect(() => {
    let cancelled = false

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (cancelled) {
        return
      }

      if (!firebaseUser) {
        setUser(null)
        setAdmin(null)
        setStatus('unauthenticated')
        return
      }

      setUser({ uid: firebaseUser.uid, email: firebaseUser.email })

      void fetchAdminProfile(firebaseUser.uid, firebaseUser.email)
        .then(async (profile) => {
          if (cancelled) {
            return
          }

          if (!profile || !profile.active) {
            await signOutAdmin().catch(() => undefined)

            if (cancelled) {
              return
            }

            setAdmin(null)
            setUser(null)
            setStatus('unauthenticated')
            setError(toAuthError(notAdminError()))
            return
          }

          setAdmin(profile)
          setStatus('authenticated')
        })
        .catch(async (caught: unknown) => {
          await signOutAdmin().catch(() => undefined)

          if (cancelled) {
            return
          }

          setAdmin(null)
          setUser(null)
          setStatus('unauthenticated')
          setError(toAuthError(caught))
        })
    });

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string): Promise<AuthError | null> => {
      setError(null)

      try {
        const profile = await signInAdmin(email, password)
        setAdmin(profile)
        setUser({ uid: profile.uid, email: profile.email })
        setStatus('authenticated')
        return null
      } catch (caught) {
        const authError = toAuthError(caught)
        setAdmin(null)
        setUser(null)
        setStatus('unauthenticated')
        setError(authError)
        return authError
      }
    },
    [],
  )

  const logout = useCallback(async () => {
    await signOutAdmin()
    setAdmin(null)
    setUser(null)
    setStatus('unauthenticated')
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value = useMemo(
    () => ({ status, user, admin, error, login, logout, clearError }),
    [status, user, admin, error, login, logout, clearError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
