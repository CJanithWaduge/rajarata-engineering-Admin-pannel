export const ROUTES = {
  root: '/',
  login: '/login',
  dashboard: '/dashboard',
  settings: '/settings',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
