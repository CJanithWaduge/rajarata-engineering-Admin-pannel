import { z } from 'zod'
import type { SettingsFormValues } from './types'

const phoneSchema = z
  .string()
  .transform((value) => value.trim())
  .refine(
    (value) => value === '' || /^\+?[0-9][0-9\s().-]{6,19}$/.test(value.replace(/\s+/g, '')),
    { message: 'Enter a phone number in international format, or leave it empty.' },
  )
  .refine((value) => value === '' || /^\+[1-9]\d{7,14}$/.test(value.replace(/[\s().-]/g, '')), {
    message: 'Enter a phone number in international format, or leave it empty.',
  })

const whatsappSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value === '' || /^[1-9]\d{7,14}$/.test(value.replace(/[^\d]/g, '')), {
    message: 'Enter a WhatsApp number as digits with country code (8–15 digits), or leave it empty.',
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

export const settingsSchema = z.object({
  phone: phoneSchema,
  whatsapp: whatsappSchema,
  email: emailSchema,
  address: addressSchema,
  facebookUrl: facebookUrlSchema,
  facebookLabel: facebookLabelSchema,
  location: locationSchema,
})

export function normaliseSettings(input: SettingsFormValues): SettingsFormValues {
  const phone = input.phone.trim()
  const whatsappDigits = input.whatsapp.trim().replace(/[^\d]/g, '')
  const phoneClean = phone.replace(/[\s().-]/g, '')
  const phoneNormalised =
    phone === '' ? '' : phoneClean.startsWith('+') ? phoneClean : phoneClean

  return {
    phone: phone === '' ? '' : phoneNormalised.startsWith('+') ? phoneNormalised : phone.startsWith('+') ? phoneClean : phone,
    whatsapp: whatsappDigits === '' ? '' : whatsappDigits,
    email: input.email.trim(),
    address: input.address.replace(/\r\n/g, '\n'),
    facebookUrl: input.facebookUrl.trim(),
    facebookLabel: input.facebookLabel.trim(),
    location: input.location.trim(),
  }
}

export type SettingsFormSchema = z.infer<typeof settingsSchema>
