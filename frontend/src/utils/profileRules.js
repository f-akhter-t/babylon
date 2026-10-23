// Checks for the Profile page. The page uses them to show messages and
// disable buttons, and services/api.js runs them again before saving,
// the way a backend would. Each check returns '' when the value is fine.

export const NAME_MIN = 2
export const NAME_MAX = 50
export const ADDRESS_MAX = 120
export const NID_LENGTHS = [10, 13, 17]
export const MAX_ID_PHOTO_MB = 5

import { checkDivision } from './divisions'

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

export const JOB_TITLE_MIN = 2
export const JOB_TITLE_MAX = 60

// Staff only: the job title shown on their profile.
export function checkJobTitle(value) {
  const title = value.trim()
  if (!title) return 'Please enter your job title.'
  if (title.length < JOB_TITLE_MIN) return `Your job title needs at least ${JOB_TITLE_MIN} characters.`
  if (title.length > JOB_TITLE_MAX) return `Your job title can be at most ${JOB_TITLE_MAX} characters.`
  return ''
}

export function checkAddress(value) {
  if (value.trim().length > ADDRESS_MAX) {
    return `The address can be at most ${ADDRESS_MAX} characters.`
  }
  return ''
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

// The reason an admin gives when rejecting an identity. The citizen sees it.
export const REJECT_REASON_MIN = 5
export const REJECT_REASON_MAX = 200

export function checkRejectReason(value) {
  const reason = value.trim()
  if (!reason) return 'Please write a reason for the citizen.'
  if (reason.length < REJECT_REASON_MIN) {
    return `The reason needs at least ${REJECT_REASON_MIN} characters.`
  }
  if (reason.length > REJECT_REASON_MAX) {
    return `The reason can be at most ${REJECT_REASON_MAX} characters.`
  }
  return ''
}

export function checkDetails({ name, address, division }) {
  return {
    name: checkName(name),
    address: checkAddress(address),
    division: checkDivision(division),
  }
}
