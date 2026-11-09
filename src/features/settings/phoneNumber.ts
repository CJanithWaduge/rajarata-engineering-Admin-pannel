/**
 * Sri Lankan contact-number handling for Site Settings.
 *
 * Sri Lanka uses the E.164 country code `+94` and a nine-digit national
 * significant number, so a local number is ten digits (`0771234567`) and its
 * international form is `+94771234567`. Both fields are normalised to the
 * shape the public site accepts: phone as `+94XXXXXXXXX` and WhatsApp as
 * digits only (`94XXXXXXXXX`), because `wa.me` links reject a leading `+`.
 */
export const SRI_LANKA_DIAL_CODE = '94'

/** `0` (trunk prefix) plus the nine-digit national number. */
export const SRI_LANKA_LOCAL_NUMBER_LENGTH = 10

/** Digits after the `+94` country code. */
export const SRI_LANKA_NATIONAL_NUMBER_LENGTH = 9

const SEPARATORS = /[\s().-]/g

/** Removes the spaces, dots, parentheses, and dashes people type in numbers. */
function compact(value: string): string {
  return value.trim().replace(SEPARATORS, '')
}

/**
 * Returns the nine-digit national significant number, or null when the input
 * is not a Sri Lankan number.
 *
 * Accepted shapes: `0771234567`, `+94771234567`, `94771234567`, and
 * `0094771234567`. The national number must start with 1–9, never 0.
 */
function nationalNumber(value: string): string | null {
  const digitsOnly = compact(value)
  let national: string

  if (digitsOnly.startsWith('+')) {
    if (!digitsOnly.startsWith(`+${SRI_LANKA_DIAL_CODE}`)) return null
    national = digitsOnly.slice(1 + SRI_LANKA_DIAL_CODE.length)
  } else if (digitsOnly.startsWith(`00${SRI_LANKA_DIAL_CODE}`)) {
    national = digitsOnly.slice(2 + SRI_LANKA_DIAL_CODE.length)
  } else if (
    digitsOnly.startsWith(SRI_LANKA_DIAL_CODE) &&
    digitsOnly.length === SRI_LANKA_DIAL_CODE.length + SRI_LANKA_NATIONAL_NUMBER_LENGTH
  ) {
    national = digitsOnly.slice(SRI_LANKA_DIAL_CODE.length)
  } else if (digitsOnly.startsWith('0')) {
    national = digitsOnly.slice(1)
  } else {
    return null
  }

  if (national.length !== SRI_LANKA_NATIONAL_NUMBER_LENGTH) return null
  if (!/^[1-9]\d{8}$/.test(national)) return null

  return national
}

/** Returns `+94XXXXXXXXX` for a Sri Lankan phone number, or null when invalid. */
export function normaliseSriLankaPhone(value: string): string | null {
  const national = nationalNumber(value)
  return national === null ? null : `+${SRI_LANKA_DIAL_CODE}${national}`
}

/**
 * Returns `94XXXXXXXXX` (no `+`) for a Sri Lankan WhatsApp number, or null when
 * invalid. The public site builds `https://wa.me/<value>` links from this shape.
 */
export function normaliseSriLankaWhatsApp(value: string): string | null {
  const national = nationalNumber(value)
  return national === null ? null : `${SRI_LANKA_DIAL_CODE}${national}`
}
