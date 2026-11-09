import { describe, expect, it } from 'vitest'
import { normaliseSriLankaPhone, normaliseSriLankaWhatsApp } from '../phoneNumber'

describe('normaliseSriLankaPhone', () => {
  it('accepts a ten-digit local number and stores it in E.164 form', () => {
    expect(normaliseSriLankaPhone('0771234567')).toBe('+94771234567')
  })

  it('accepts the +94 international form', () => {
    expect(normaliseSriLankaPhone('+94771234567')).toBe('+94771234567')
  })

  it('accepts the 94 international form without a plus', () => {
    expect(normaliseSriLankaPhone('94771234567')).toBe('+94771234567')
  })

  it('accepts the 0094 international prefix', () => {
    expect(normaliseSriLankaPhone('0094771234567')).toBe('+94771234567')
  })

  it('strips spaces, dashes, dots, and parentheses', () => {
    expect(normaliseSriLankaPhone('+94 (77) 123-4567')).toBe('+94771234567')
    expect(normaliseSriLankaPhone('077 123 4567')).toBe('+94771234567')
  })

  it('accepts a ten-digit landline number', () => {
    expect(normaliseSriLankaPhone('025 222 2222')).toBe('+94252222222')
  })

  it('rejects a local number that is not ten digits', () => {
    expect(normaliseSriLankaPhone('077123456')).toBeNull()
    expect(normaliseSriLankaPhone('07712345678')).toBeNull()
  })

  it('rejects a number without a local or international prefix', () => {
    expect(normaliseSriLankaPhone('771234567')).toBeNull()
  })

  it('rejects a foreign international number', () => {
    expect(normaliseSriLankaPhone('+447712345678')).toBeNull()
  })

  it('rejects a trunk zero after the country code', () => {
    expect(normaliseSriLankaPhone('+940771234567')).toBeNull()
  })

  it('rejects non-numeric input and blanks', () => {
    expect(normaliseSriLankaPhone('07712345a7')).toBeNull()
    expect(normaliseSriLankaPhone('')).toBeNull()
    expect(normaliseSriLankaPhone('   ')).toBeNull()
  })
})

describe('normaliseSriLankaWhatsApp', () => {
  it('stores a local number as digits only for wa.me links', () => {
    expect(normaliseSriLankaWhatsApp('0771234567')).toBe('94771234567')
  })

  it('accepts the +94 and 94 international forms', () => {
    expect(normaliseSriLankaWhatsApp('+94 77 123 4567')).toBe('94771234567')
    expect(normaliseSriLankaWhatsApp('94771234567')).toBe('94771234567')
  })

  it('never returns a leading plus or separators', () => {
    expect(normaliseSriLankaWhatsApp('+94771234567')).toMatch(/^[1-9]\d{7,14}$/)
  })

  it('rejects invalid and foreign numbers', () => {
    expect(normaliseSriLankaWhatsApp('077123456')).toBeNull()
    expect(normaliseSriLankaWhatsApp('+447712345678')).toBeNull()
    expect(normaliseSriLankaWhatsApp('')).toBeNull()
  })
})
