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
  // Primary record: admins/{uid}. This is the canonical form and supports
  // revocation without touching the Auth account.
  const byUid = await getDoc(doc(db, ADMINS_COLLECTION, uid))
  if (byUid.exists()) {
    return toAdminProfile(uid, authEmail, byUid.data())
  }

  // Fallback: admins/{email}. Lets an owner provision an admin straight from
  // the Firebase Console by creating a document whose ID is the account email,
  // without having to copy the uid. Lowercased to match the rules check.
  const email = authEmail?.trim().toLowerCase()
  if (!email) return null

  const byEmail = await getDoc(doc(db, ADMINS_COLLECTION, email))
  if (byEmail.exists()) {
    return toAdminProfile(uid, authEmail, byEmail.data())
  }

  return null
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
