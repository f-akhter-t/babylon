// Checks for the Profile page. The page uses them to show messages and
// disable buttons, and services/api.js runs them again before saving,
// the way a backend would. Each check returns '' when the value is fine.

export const NAME_MIN = 2
export const NAME_MAX = 50
export const ADDRESS_MAX = 120
export const NID_LENGTHS = [10, 13, 17]
export const MAX_ID_PHOTO_MB = 5

// Chattogram City Corporation has 41 wards.
export const WARDS = Array.from({ length: 41 }, (_, i) => `Ward ${i + 1}`)

export function checkName(value) {
  const name = value.trim()
  if (!name) return 'Please enter your name.'
  if (name.length < NAME_MIN) return `Your name needs at least ${NAME_MIN} characters.`
  if (name.length > NAME_MAX) return `Your name can be at most ${NAME_MAX} characters.`
  // Letters in any script (Bangla too), spaces, dots, hyphens and apostrophes.
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(name)) {
    return 'Use letters, spaces, dots and hyphens only.'
  }
  return ''
}

export function checkAddress(value) {
  if (value.trim().length > ADDRESS_MAX) {
    return `The address can be at most ${ADDRESS_MAX} characters.`
  }
  return ''
}

export function checkWard(value) {
  return WARDS.includes(value) ? '' : 'Please choose your ward.'
}

// Accepts "01712 345678", "01712-345678" or "+8801712345678" and returns
// the plain 11-digit form (01712345678).
export function normalizePhone(value) {
  const digits = value.replace(/[\s-]/g, '')
  return digits.startsWith('+880') ? `0${digits.slice(4)}` : digits
}

// Bangladesh mobile numbers: 11 digits, 013 to 019.
export function checkPhone(value) {
  const phone = normalizePhone(value)
  if (!phone) return 'Please enter your mobile number.'
  if (!/^\d+$/.test(phone)) return 'Use digits only.'
  if (phone.length !== 11 || !/^01[3-9]/.test(phone)) {
    return 'Enter an 11-digit mobile number that starts with 013 to 019.'
  }
  return ''
}

export function normalizeNid(value) {
  return value.replace(/[\s-]/g, '')
}

// Smart cards have 10 digits. Older cards have 13 or 17.
export function checkNid(value) {
  const nid = normalizeNid(value)
  if (!nid) return 'Please enter your NID number.'
  if (!/^\d+$/.test(nid)) return 'Use digits only.'
  if (!NID_LENGTHS.includes(nid.length)) {
    return 'An NID number has 10 digits (smart card), or 13 or 17 digits (older cards).'
  }
  return ''
}

export function checkIdPhoto(file) {
  if (!file) return 'Please add a photo of the front of your NID card.'
  if (!file.type.startsWith('image/')) return 'Please choose an image file (JPG, PNG or WebP).'
  if (file.size > MAX_ID_PHOTO_MB * 1024 * 1024) {
    return `That photo is larger than ${MAX_ID_PHOTO_MB} MB. Please pick a smaller one.`
  }
  return ''
}

export function checkDetails({ name, address, ward }) {
  return {
    name: checkName(name),
    address: checkAddress(address),
    ward: checkWard(ward),
  }
}
