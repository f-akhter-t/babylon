// The citizen's profile on the backend: details, phone check and identity.
// api.js calls these for citizens. Staff have their own file (staffApi.js).
// The account comes from the token, so no email is sent.
import { get, patch, post } from './http.js'
import {
  checkDetails,
  checkIdPhoto,
  checkNid,
  checkPhone,
  normalizeNid,
  normalizePhone,
} from '../utils/profileRules.js'
import { prepareIdPhoto } from '../utils/idPhoto.js'

export const PROFILE_EVENT = 'babylon:profile' // fired on window after every change
const OTP_RESEND_SECONDS = 30 // used only if the server does not say

const PHOTO_READ_FAILED = 'We could not prepare that photo. Please try again, or choose a different photo.'

// Everything that shows the profile (name, badges) reloads on this.
function profileChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PROFILE_EVENT))
}

export async function getProfile() {
  return get('/citizen/profile')
}

// details: { name, address, division }. Checked here for the form, and again by the server.
export async function saveProfile(details) {
  const errors = checkDetails(details)
  if (Object.values(errors).some(Boolean)) {
    throw new Error('Some details are not valid. Please check the form.')
  }
  await patch('/citizen/profile', {
    name: details.name.trim(),
    address: details.address.trim(),
    division: details.division,
  })
  const profile = await getProfile()
  profileChanged()
  return profile
}

// The server needs the same number again with the code, so it is kept here
// until the number is verified.
let lastPhone = ''

// Returns { phone, resendIn }.
export async function requestOtp(phoneInput) {
  if (checkPhone(phoneInput)) throw new Error('Please enter a valid mobile number first.')
  const phone = normalizePhone(phoneInput)
  const sent = await post('/citizen/profile/phone-code', { phone })
  lastPhone = phone
  return { phone: sent?.phone ?? phone, resendIn: sent?.resendIn ?? OTP_RESEND_SECONDS }
}

// Returns { status: 'verified', profile } | { status: 'wrong', message }
//       | { status: 'locked', message } | { status: 'expired' }
// Expired and wrong are both 400 on the field "code", so the server's
// message tells them apart for the person.
export async function verifyOtp(code) {
  if (!lastPhone) return { status: 'expired' }
  try {
    await post('/citizen/profile/phone-verify', { phone: lastPhone, code: code.trim() })
  } catch (err) {
    if (err.status === 423) return { status: 'locked', message: err.message }
    if (err.status === 400 && err.field === 'code') return { status: 'wrong', message: err.message }
    throw err
  }
  lastPhone = ''
  const profile = await getProfile()
  profileChanged()
  return { status: 'verified', profile }
}

function toDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error(PHOTO_READ_FAILED))
    reader.readAsDataURL(blob)
  })
}

// nid is the full number and photo is a File. Only the last 4 digits and the
// photo leave the browser; the full number never does.
export async function submitIdentity({ nid, photo }) {
  if (checkNid(nid) || checkIdPhoto(photo)) {
    throw new Error('Please check your NID number and photo.')
  }
  const blob = await prepareIdPhoto(photo)
  const dataUrl = await toDataUrl(blob)
  await post('/citizen/profile/identity', {
    nidLast4: normalizeNid(nid).slice(-4),
    photo: dataUrl,
  })
  const profile = await getProfile()
  profileChanged()
  return profile
}