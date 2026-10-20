export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type AdminRole = 'owner' | 'admin'

export interface AuthUser {
  uid: string
  email: string | null
}

export interface AdminProfile {
  uid: string
  email: string
  displayName: string | null
  role: AdminRole
  active: boolean
}

export type AuthErrorCode =
  | 'invalid-credentials'
  | 'invalid-email'
  | 'user-disabled'
  | 'too-many-requests'
  | 'network'
  | 'not-admin'
  | 'provider-disabled'
  | 'domain-not-authorized'
  | 'firestore-not-ready'
  | 'firestore-permission-denied'
  | 'config-error'
  | 'unknown'

export interface AuthError {
  code: AuthErrorCode
  message: string
}
