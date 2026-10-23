// Admin: check the identity a citizen sent.
// Privacy rules: the full NID number is never stored, so it cannot appear here.
// The card photo is deleted in the same database write as the decision.
import mongoose from 'mongoose'
import Identity from '../../models/identity.model.js'
import User from '../../models/user.model.js'
import AppError from '../../utils/AppError.js'
import { reasonSentence } from '../../utils/text.js'
import { ADMIN_LIMITS } from '../../constants/limits.js'
import { MSG } from '../../constants/messages/index.js'
import { notify } from '../../shared/service/alerts.service.js'

const { min, max } = ADMIN_LIMITS.identityRejectReason

function checkId(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError('not-found', 404, MSG.submissionGone)
}

async function namesFor(emails) {
  const users = await User.find({ email: { $in: emails } }, 'email name').lean()
  return new Map(users.map((user) => [user.email, user.name]))
}

const present = (submission, name) => ({
  id: String(submission._id),
  email: submission.userEmail,
  name: name ?? submission.userEmail,
  nidLast4: submission.nidLast4,
  submittedAt: new Date(submission.submittedAt).toISOString(),
})

// Everyone waiting, oldest first, so whoever has waited longest is checked first.
export async function getQueue() {
  const waiting = await Identity.find({ status: 'pending' }).sort({ submittedAt: 1 }).lean()
  const names = await namesFor(waiting.map((item) => item.userEmail))
  return waiting.map((item) => present(item, names.get(item.userEmail)))
}

export function getCount() {
  return Identity.countDocuments({ status: 'pending' }).then((count) => ({ count }))
}

// The card photo for one pending submission.
export async function getPhoto(id) {
  checkId(id)
  const submission = await Identity.findOne({ _id: id, status: 'pending' }).select('+photo')
  if (!submission?.photo?.data) throw new AppError('not-found', 404, MSG.photoGone)
  return { contentType: submission.photo.contentType, data: submission.photo.data }
}

// decision: 'approve' | 'reject'. A reject needs a reason, which the citizen sees.
export async function review(id, { decision, reason = '' }) {
  checkId(id)
  if (decision !== 'approve' && decision !== 'reject') {
    throw new AppError('invalid', 400, MSG.chooseDecision, 'decision')
  }
  const text = String(reason).trim()
  if (decision === 'reject') {
    if (!text) throw new AppError('invalid', 400, MSG.identityReasonNeeded, 'reason')
    if (text.length < min) throw new AppError('invalid', 400, MSG.identityReasonShort, 'reason')
    if (text.length > max) throw new AppError('invalid', 400, MSG.identityReasonLong, 'reason')
  }

  const status = decision === 'approve' ? 'verified' : 'rejected'
  // One write: it checks the state, saves the decision and removes the photo.
  // An approval also needs the photo to be there.
  const filter = { _id: id, status: 'pending' }
  if (decision === 'approve') filter['photo.data'] = { $exists: true }
  const done = await Identity.findOneAndUpdate(
    filter,
    {
      $set: { status, reviewedAt: new Date(), reason: decision === 'reject' ? text : '' },
      $unset: { photo: 1 },
    },
    { returnDocument: 'after' },
  ).lean()

  if (!done) {
    const current = await Identity.findById(id).select('status').lean()
    if (!current) throw new AppError('not-found', 404, MSG.submissionGone)
    if (current.status !== 'pending') throw new AppError('conflict', 409, MSG.alreadyReviewed)
    throw new AppError('conflict', 409, MSG.noPhotoToApprove)
  }

  try {
    await notify(done.userEmail, {
      kind: status === 'verified' ? 'identity-verified' : 'identity-rejected',
      text:
        status === 'verified'
          ? MSG.identityVerifiedForCitizen
          : MSG.identityRejectedForCitizen(reasonSentence(text)),
      link: '/profile',
    })
  } catch (err) {
    console.error('Could not send a notice:', err.message)
  }

  const names = await namesFor([done.userEmail])
  return { ...present(done, names.get(done.userEmail)), status, photoDeleted: true }
}
