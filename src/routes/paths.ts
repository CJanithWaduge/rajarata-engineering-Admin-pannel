export const ROUTES = {
  root: '/',
  login: '/login',
  dashboard: '/dashboard',
  home: '/home',
  services: '/services',
  about: '/about',
  settings: '/settings',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
