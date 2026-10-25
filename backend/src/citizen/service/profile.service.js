import User from '../../models/user.model.js'
import Identity from '../../models/identity.model.js'
import AppError from '../../utils/AppError.js'
import { MSG } from '../../constants/messages/index.js'
import { sendCode, verifyCode } from '../../shared/service/phoneCode.service.js'

// The owner always comes from the token. Never from the URL or body.
export async function getProfile(email) {
  const user = await User.findOne({ email }).lean()
  if (!user) throw new AppError('not-found', 404, MSG.profileGone)

  // Newest record first: a rejected citizen can submit again.
  // Pick the fields by name, so the NID photo is never loaded here.
  const record = await Identity.findOne({ userEmail: email })
    .sort({ submittedAt: -1 })
    .select('status nidLast4 submittedAt reason')
    .lean()

  const identity = record
    ? {
      status: record.status,
      nidLast4: record.nidLast4 ?? '',
      submittedAt: record.submittedAt ?? null,
      reason: record.reason ?? '',
    }
    : { status: 'not-submitted', nidLast4: '', submittedAt: null, reason: '' }
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department ?? null,
    phone: user.phone ?? '',
    phoneVerified: Boolean(user.phoneVerified),
    emailVerified: Boolean(user.emailVerified),
    address: user.address ?? '',
    division: user.division ?? '',
    identity,
    // Same rule as the frontend: a verified ID is what makes the badge.
    isVerified: identity.status === 'verified',
    // Staff fields. departmentVerified, employeeIdVerified and photo wait for the G1 model PR.
    jobTitle: user.jobTitle ?? '',
    employeeId: user.employeeId ?? '',
    onboarded: user.onboarded ?? true,
  }
}

// Saves only the fields that were sent. The email comes from the token.
export async function updateProfile(email, changes) {
  const saved = await User.findOneAndUpdate({ email }, { $set: changes }, { new: true }).lean()
  if (!saved) throw new AppError('not-found', 404, MSG.profileGone)
  return getProfile(email)
}

// Endpoint 19. The phone is NOT saved here. It is saved only after the code is verified.
export async function requestPhoneCode(email, phone) {
  const user = await User.findOne({ email }).select('_id phone phoneVerified').lean()
  if (!user) throw new AppError('not-found', 404, MSG.profileGone)
  if (user.phoneVerified && user.phone === phone) {
    throw new AppError('invalid', 400, MSG.phoneAlreadyVerified, 'phone')
  }
  const { resendAfter } = await sendCode({ userId: String(user._id), phone })
  return { phone, resendIn: resendAfter } // the frontend expects resendIn
}

// Endpoint 20. The phone service never touches the user, so we set the fields here.
export async function confirmPhoneCode(email, phone, code) {
  const user = await User.findOne({ email }).select('_id').lean()
  if (!user) throw new AppError('not-found', 404, MSG.profileGone)
  await verifyCode({ userId: String(user._id), phone, code })
  await User.updateOne({ _id: user._id }, { $set: { phone, phoneVerified: true } })
  return getProfile(email)
}

// Endpoint 21. One open submission at a time: pending or verified blocks a new one.
// A rejected citizen may submit again (a new record; the old one stays as history).
export async function submitIdentity(email, { nidLast4, photo }) {
  const user = await User.findOne({ email }).select('_id').lean()
  if (!user) throw new AppError('not-found', 404, MSG.profileGone)

  const open = await Identity.findOne({ userEmail: email, status: { $in: ['pending', 'verified'] } })
    .select('status')
    .lean()
  if (open) {
    throw new AppError('conflict', 409, open.status === 'pending' ? MSG.identityPending : MSG.identityAlreadyVerified)
  }

  await Identity.create({ userEmail: email, status: 'pending', nidLast4, submittedAt: new Date(), photo })
  return getProfile(email) // getProfile selects fields by name, so the photo is never returned
}