import { describe, expect, it } from 'vitest'
import { ROUTES } from '../paths'
import { getRedirectTarget } from '../redirect'

describe('getRedirectTarget', () => {
  it('falls back to the dashboard when no state is present', () => {
    expect(getRedirectTarget(undefined)).toBe(ROUTES.dashboard)
    expect(getRedirectTarget(null)).toBe(ROUTES.dashboard)
    expect(getRedirectTarget('https://evil.example')).toBe(ROUTES.dashboard)
  })

  it('keeps a same-origin pathname with search and hash', () => {
    expect(
      getRedirectTarget({
        pathname: '/services',
        search: '?page=2',
        hash: '#top',
      }),
    ).toBe('/services?page=2#top')
  })

  it('rejects protocol-relative and external paths', () => {
    expect(getRedirectTarget({ pathname: '//evil.example' })).toBe(
      ROUTES.dashboard,
    )
    expect(getRedirectTarget({ pathname: 'https://evil.example' })).toBe(
      ROUTES.dashboard,
    )
  })

  it('does not loop back to the login page', () => {
    expect(getRedirectTarget({ pathname: ROUTES.login })).toBe(ROUTES.dashboard)
  })

  it('keeps a normal protected dashboard path', () => {
    expect(getRedirectTarget({ pathname: ROUTES.dashboard })).toBe(
      ROUTES.dashboard,
    )
  })
})
