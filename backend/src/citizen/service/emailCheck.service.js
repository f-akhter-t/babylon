// The citizen email check: a code goes to the account's own address, and the
// right code marks it verified. The shared email-code service keeps the codes
// (hashed, 30 s between sends, 3 tries, 10 minutes); this file only decides who
// may ask and sets the flag. Checking the email never blocks a citizen from
// anything: it is a badge on the profile.
import User from '../../models/user.model.js'
import AppError from '../../utils/AppError.js'
import { MSG } from '../../constants/messages/index.js'
import * as emailCodes from '../../shared/service/emailCode.service.js'
import { getProfile } from './profile.service.js'

async function loadCitizen(email) {
  const user = await User.findOne({ email }).select('_id email emailVerified').lean()
  if (!user) throw new AppError('not-found', 404, MSG.profileGone)
  return user
}

// POST /citizen/profile/email-code. The address comes from the account, never
// from the request, so a code cannot be sent to someone else.
export async function requestCode(email) {
  const user = await loadCitizen(email)
  if (user.emailVerified === true) throw new AppError('conflict', 409, MSG.emailAlreadyVerified)
  const sent = await emailCodes.sendCode({ userId: user._id, email: user.email, purpose: 'verify' })
  return { email: user.email, resendAfter: sent.resendAfter }
}

// POST /citizen/profile/email-verify. Answers with the whole profile, like the
// phone check does. An address that is already verified just returns it.
export async function verify(email, code) {
  const user = await loadCitizen(email)
  if (user.emailVerified !== true) {
    await emailCodes.verifyCode({ userId: user._id, email: user.email, purpose: 'verify', code })
    await User.updateOne({ _id: user._id }, { $set: { emailVerified: true } })
  }
  return getProfile(email)
}
