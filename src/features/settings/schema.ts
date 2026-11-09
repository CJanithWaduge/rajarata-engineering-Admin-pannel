import { z } from 'zod'
import {
  MAP_EMBED_MAX_LENGTH,
  extractGoogleMapEmbedUrl,
  isGoogleMapEmbedUrl,
} from './mapEmbed'
import { normaliseSriLankaPhone, normaliseSriLankaWhatsApp } from './phoneNumber'
import type { SettingsFormValues } from './types'

export const PHONE_NUMBER_MESSAGE =
  'Enter a Sri Lankan phone number as 0771234567 (10 digits) or +94771234567, or leave it empty.'

export const WHATSAPP_NUMBER_MESSAGE =
  'Enter a Sri Lankan WhatsApp number as 0771234567 (10 digits) or +94771234567, or leave it empty.'

const phoneSchema = z
  .string()
  .transform((value, ctx) => {
    const trimmed = value.trim()
    if (trimmed === '') return ''

    const normalised = normaliseSriLankaPhone(trimmed)
    if (normalised === null) {
      ctx.addIssue({ code: 'custom', message: PHONE_NUMBER_MESSAGE })
      return z.NEVER
    }

    return normalised
  })

const whatsappSchema = z
  .string()
  .transform((value, ctx) => {
    const trimmed = value.trim()
    if (trimmed === '') return ''

    const normalised = normaliseSriLankaWhatsApp(trimmed)
    if (normalised === null) {
      ctx.addIssue({ code: 'custom', message: WHATSAPP_NUMBER_MESSAGE })
      return z.NEVER
    }

    return normalised
  })

const emailSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
    message: 'Enter a valid email address, or leave it empty.',
  })

const addressSchema = z
  .string()
  .transform((value) => value.replace(/\r\n/g, '\n'))
  .refine((value) => value.length <= 300, { message: 'Address is too long.' })
  .refine((value) => value === '' || value.split('\n').length <= 5, { message: 'Address is too long.' })

const facebookUrlSchema = z
  .string()
  .transform((value) => value.trim())
  .refine(
    (value) =>
      value === '' ||
      /^https:\/\/([a-z0-9-]+\.)*(facebook\.com|fb\.com|fb\.me)\/\S+$/i.test(value),
    {
      message: 'Enter a full https:// Facebook page URL, or leave it empty.',
    },
  )

const facebookLabelSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length <= 40, {
    message: 'Link text must be 40 characters or fewer.',
  })

const locationSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length <= 80, { message: 'Location label is too long.' })

const mapEmbedSchema = z
  .string()
  .transform((value) => extractGoogleMapEmbedUrl(value))
  .refine((value) => value.length <= MAP_EMBED_MAX_LENGTH, {
    message: 'The Google Maps embed URL is too long.',
  })
  .refine((value) => value === '' || isGoogleMapEmbedUrl(value), {
    message:
      'Paste the Google Maps embed code, or its https://www.google.com/maps/embed?... URL, or leave it empty.',
  })

const logoAltSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length <= 160, {
    message: 'Logo alt text must be 160 characters or fewer.',
  })

export const settingsSchema = z.object({
  phone: phoneSchema,
  whatsapp: whatsappSchema,
  email: emailSchema,
  address: addressSchema,
  facebookUrl: facebookUrlSchema,
  facebookLabel: facebookLabelSchema,
  location: locationSchema,
  mapEmbedUrl: mapEmbedSchema,
  logoAlt: logoAltSchema,
})

export function normaliseSettings(input: SettingsFormValues): SettingsFormValues {
  const phone = input.phone.trim()
  const whatsapp = input.whatsapp.trim()

  return {
    phone: phone === '' ? '' : (normaliseSriLankaPhone(phone) ?? phone),
    whatsapp: whatsapp === '' ? '' : (normaliseSriLankaWhatsApp(whatsapp) ?? whatsapp),
    email: input.email.trim(),
    address: input.address.replace(/\r\n/g, '\n'),
    facebookUrl: input.facebookUrl.trim(),
    facebookLabel: input.facebookLabel.trim(),
    location: input.location.trim(),
    mapEmbedUrl: extractGoogleMapEmbedUrl(input.mapEmbedUrl),
    logoAlt: input.logoAlt.trim(),
  }
}

export type SettingsFormSchema = z.infer<typeof settingsSchema>
