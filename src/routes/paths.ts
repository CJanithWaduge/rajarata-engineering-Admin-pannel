export const ROUTES = {
  root: '/',
  login: '/login',
  dashboard: '/dashboard',
  home: '/home',
  settings: '/settings',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
