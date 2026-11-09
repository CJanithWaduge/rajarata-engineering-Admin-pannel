import { describe, expect, it } from 'vitest'
import { settingsSchema } from '../schema'
import type { SettingsFormValues } from '../types'

const base: SettingsFormValues = {
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  facebookUrl: '',
  facebookLabel: '',
  location: '',
  mapEmbedUrl: '',
  logoAlt: '',
}

const embedUrl =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3948.0778077008304!2d80.41277907454942!3d8.295055791740014!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2slk!4v1794028086994!5m2!1sen!2slk'

function parse(mapEmbedUrl: string) {
  return settingsSchema.safeParse({ ...base, mapEmbedUrl })
}

describe('settingsSchema Google Maps embed', () => {
  it('accepts a bare Google Maps embed URL', () => {
    const result = parse(embedUrl)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.mapEmbedUrl).toBe(embedUrl)
  })

  it('extracts the src and decodes &amp; from a pasted iframe snippet', () => {
    const snippet = `<iframe src="${embedUrl.replace(/&/g, '&amp;')}" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`
    const result = parse(snippet)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.mapEmbedUrl).toBe(embedUrl)
  })

  it('accepts an empty value so the public fallback map stays in place', () => {
    const result = parse('')

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.mapEmbedUrl).toBe('')
  })

  it('rejects an embed from another origin', () => {
    expect(parse('https://maps.example.com/embed?pb=!1m18').success).toBe(false)
  })

  it('rejects a non-https Google Maps URL', () => {
    expect(parse('http://www.google.com/maps/embed?pb=!1m18').success).toBe(false)
  })

  it('rejects a Google URL that is not an embed', () => {
    expect(parse('https://www.google.com/maps/place/Power+Engineering').success).toBe(
      false,
    )
  })
})

describe('settingsSchema Sri Lankan contact numbers', () => {
  function parseNumbers(phone: string, whatsapp = '') {
    return settingsSchema.safeParse({ ...base, phone, whatsapp })
  }

  it('normalises a ten-digit local phone number to +94', () => {
    const result = parseNumbers('0771234567')

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.phone).toBe('+94771234567')
  })

  it('normalises a +94 phone number and keeps it in E.164 form', () => {
    const result = parseNumbers('+94 77 123 4567')

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.phone).toBe('+94771234567')
  })

  it('rejects a phone number that is not ten local digits', () => {
    expect(parseNumbers('077123456').success).toBe(false)
    expect(parseNumbers('07712345678').success).toBe(false)
  })

  it('rejects a foreign phone number', () => {
    expect(parseNumbers('+447712345678').success).toBe(false)
  })

  it('normalises WhatsApp to digits only, without a plus', () => {
    const result = parseNumbers('', '+94 77 123 4567')

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.whatsapp).toBe('94771234567')
  })

  it('accepts an empty WhatsApp number', () => {
    const result = parseNumbers('')

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.whatsapp).toBe('')
  })

  it('rejects an invalid WhatsApp number', () => {
    expect(parseNumbers('', '077123456').success).toBe(false)
    expect(parseNumbers('', '+447712345678').success).toBe(false)
  })

  it('accepts the already-normalised stored values without changing them', () => {
    const result = parseNumbers('+94771234567', '94771234567')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.phone).toBe('+94771234567')
      expect(result.data.whatsapp).toBe('94771234567')
    }
  })
})
