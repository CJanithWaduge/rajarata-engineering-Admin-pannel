export const ROUTES = {
  root: '/',
  login: '/login',
  dashboard: '/dashboard',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
