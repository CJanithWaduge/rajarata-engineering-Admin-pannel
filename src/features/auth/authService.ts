import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'
import { notAdminError } from './errors'
import type { AdminProfile, AdminRole } from './types'

export const ADMINS_COLLECTION = 'admins'

export interface AdminRecord {
  email?: unknown
  displayName?: unknown
  role?: unknown
  active?: unknown
}

export function normalizeEmail(email: string): string {
  return email.trim()
}

export function toAdminProfile(
  uid: string,
  authEmail: string | null,
  record: AdminRecord,
): AdminProfile {
  const role: AdminRole = record.role === 'owner' ? 'owner' : 'admin'
  const storedEmail =
    typeof record.email === 'string' ? record.email.trim() : ''
  const displayName =
    typeof record.displayName === 'string' ? record.displayName.trim() : ''

  return {
    uid,
    email: storedEmail || authEmail || '',
    displayName: displayName || null,
    role,
    active: record.active !== false,
  }
}

export async function fetchAdminProfile(
  uid: string,
  authEmail: string | null = null,
): Promise<AdminProfile | null> {
  const snapshot = await getDoc(doc(db, ADMINS_COLLECTION, uid))

  if (!snapshot.exists()) {
    return null
  }

  return toAdminProfile(uid, authEmail, snapshot.data())
}

async function endSessionSafely(): Promise<void> {
  try {
    await signOut(auth)
  } catch {
    // The caller is already handling the primary failure. Signing out is best-effort.
  }
}

export async function signInAdmin(
  email: string,
  password: string,
): Promise<AdminProfile> {
  const credential = await signInWithEmailAndPassword(
    auth,
    normalizeEmail(email),
    password,
  )

  let profile: AdminProfile | null

  try {
    profile = await fetchAdminProfile(
      credential.user.uid,
      credential.user.email,
    )
  } catch (error) {
    await endSessionSafely()
    throw error
  }

  if (!profile || !profile.active) {
    await endSessionSafely()
    throw notAdminError()
  }

  return profile
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth)
}

export async function sendAdminResetEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, normalizeEmail(email))
}
