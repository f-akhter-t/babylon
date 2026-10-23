import User from '../../models/user.model.js'
import Identity from '../../models/identity.model.js'
import AppError from '../../utils/AppError.js'
import { MSG } from '../../constants/messages/index.js'

// The owner always comes from the token. Never from the URL or body.
export async function getProfile(email) {
  const user = await User.findOne({ email }).lean()
  if (!user) throw new AppError('not-found', 404, MSG.profileGone)

  // Pick the fields by name, so the NID photo is never loaded here.
  const identity = await Identity.findOne({ userEmail: email })
    .select('status nidLast4 reason')
    .lean()

  return {
    name: user.name,
    email: user.email,
    phone: user.phone ?? '',
    address: user.address ?? '',
    division: user.division ?? '',
    // Only the last 4 digits and the status. The full NID is never stored.
    identity: identity
      ? { status: identity.status, nidLast4: identity.nidLast4 ?? null, reason: identity.reason ?? null }
      : { status: 'none', nidLast4: null, reason: null },
  }
}