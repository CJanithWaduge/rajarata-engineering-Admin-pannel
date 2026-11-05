export const ROUTES = {
  root: '/',
  login: '/login',
  dashboard: '/dashboard',
  home: '/home',
  services: '/services',
  about: '/about',
  projects: '/projects',
  settings: '/settings',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
