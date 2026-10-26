import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Unit tests cover the Storage pipeline; inline mode is opted into explicitly
// by the tests that need it. The real `.env` may enable inline mode.
vi.stubEnv('VITE_FIREBASE_INLINE_MEDIA', 'false')

// jsdom does not implement the object-URL API used by the image previews.
if (typeof URL.createObjectURL !== 'function') {
  Object.defineProperty(URL, 'createObjectURL', {
    value: () => 'blob:test',
    configurable: true,
    writable: true,
  })
}

if (typeof URL.revokeObjectURL !== 'function') {
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: () => {},
    configurable: true,
    writable: true,
  })
}

afterEach(() => {
  cleanup()
})
