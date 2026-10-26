import { getApp, getApps, initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'
import { env } from './env'

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

// Initialize exactly once, including across Vite HMR updates.
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)

// Second argument selects the Firestore database id (`(default)` unless
// `VITE_FIREBASE_DATABASE_ID` says otherwise). See src/lib/env.ts.
export const db = getFirestore(app, env.VITE_FIREBASE_DATABASE_ID)

export const storage = getStorage(app)

// Emulator-only wiring for the integration suite. The flag is blank in every
// real environment, so production builds never take this branch. Ports match
// the `emulators` block in firebase.json.
if (env.VITE_FIREBASE_USE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
}
