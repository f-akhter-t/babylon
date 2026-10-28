// Admin: check the department's fixes. All the rules live here.
//
// Moves of an issue (the lifecycle table in the plan):
//   approve        awaiting -> resolved / verified, priority fix-verified
//   reject         awaiting -> in-progress / none, reason kept in history
//   send to queue  reopened -> awaiting
// Every write names the state it expects in its filter, so two admins acting
// at once cannot both win: the second one gets 409.
import mongoose from 'mongoose'
import Issue from '../../models/issue.model.js'
import User from '../../models/user.model.js'
import AppError from '../../utils/AppError.js'
import { daysBetween, shortDate } from '../../utils/dates.js'
import { reasonSentence } from '../../utils/text.js'
import { ADMIN_LIMITS } from '../../constants/limits.js'
import { ROLES } from '../../constants/roles.js'
import { departmentForCategory } from '../../constants/departments.js'
import { MSG } from '../../constants/messages/index.js'
import { toIssueJSON } from '../../shared/service/issues.service.js'
import { notify, notifyMany } from '../../shared/service/alerts.service.js'

// What the Verify page reads: the public issue plus the staff-only details.
function staffView(issue) {
  return {
    ...toIssueJSON(issue),
    pendingAfterImg: issue.pendingAfterImg ?? null,
    departmentNote: issue.departmentNote ?? null,
    submittedAt: issue.submittedAt ? new Date(issue.submittedAt).toISOString() : null,
    submittedOn: issue.submittedOn ?? null,
    sentBack: issue.sentBack?.reason ? { reason: issue.sentBack.reason, on: issue.sentBack.on } : null,
  }
}

async function findIssue(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError('not-found', 404, MSG.issueGone)
  const issue = await Issue.findById(id).lean()
  if (!issue) throw new AppError('not-found', 404, MSG.issueGone)
  return issue
}

// A notice that fails must not undo a decision that is already saved.
async function tell(send) {
  try {
    await send()
  } catch (err) {
    console.error('Could not send a notice:', err.message)
  }
}

const reportLink = (issue) => `/my-reports?report=${issue._id}`

async function tellReporter(issue, kind, text) {
  if (!issue.reporterEmail) return
  await tell(() => notify(issue.reporterEmail, { kind, text, link: reportLink(issue), issueId: String(issue._id) }))
}

async function tellDepartment(issue, kind, text, link = '/department') {
  const department = departmentForCategory(issue.category)
  if (!department) return
  await tell(async () => {
    const emails = await User.find({ role: ROLES.DEPARTMENT, department }).distinct('email')
    await notifyMany(emails, { kind, text, link, issueId: String(issue._id) })
  })
}

// ---------- Reads ----------

// Newest submission first.
export async function getQueue() {
  const issues = await Issue.find({ verification: 'awaiting' }).sort({ submittedAt: -1 }).lean()
  return issues.map(staffView)
}

export async function getReopened() {
  const issues = await Issue.find({ verification: 'reopened' }).sort({ reopenedAt: -1 }).lean()
  return issues.map(staffView)
}

export async function getCounts(division = '') {
  const where = division ? { division } : {}
  const [queue, reopened] = await Promise.all([
    Issue.countDocuments({ ...where, verification: 'awaiting' }),
    Issue.countDocuments({ ...where, verification: 'reopened' }),
  ])
  return { queue, reopened }
}

// ---------- Decisions ----------

// The fix is real. The issue closes and the after-photo becomes public.
export async function approve(id) {
  const issue = await findIssue(id)
  if (issue.verification !== 'awaiting') throw new AppError('conflict', 409, MSG.alreadyChecked)

  const now = new Date()
  const set = {
    status: 'resolved',
    priority: 'fix-verified',
    verification: 'verified',
    resolvedAt: now,
    resolvedOn: shortDate(now),
    fixedInDays: daysBetween(issue.createdAt, now),
  }
  if (issue.pendingAfterImg) set.afterImg = issue.pendingAfterImg

  const updated = await Issue.findOneAndUpdate(
    { _id: issue._id, verification: 'awaiting' },
    { $set: set, $unset: { pendingAfterImg: 1, sentBack: 1 } },
    { returnDocument: 'after' },
  ).lean()
  if (!updated) throw new AppError('conflict', 409, MSG.alreadyChecked)

  await tellReporter(updated, 'resolved', MSG.resolvedForReporter(updated.title))
  await tellDepartment(updated, 'fix-verified', MSG.fixVerifiedForDepartment(updated.title))
  return toIssueJSON(updated)
}

// The fix is not good enough. Back to In progress, with the reason. The
// rejected photo is deleted.
export async function reject(id, reason = '') {
  const text = String(reason).trim()
  if (!text) throw new AppError('invalid', 400, MSG.rejectReasonNeeded, 'reason')
  if (text.length > ADMIN_LIMITS.fixRejectReasonMax) {
    throw new AppError('invalid', 400, MSG.rejectReasonTooLong, 'reason')
  }
  const issue = await findIssue(id)
  if (issue.verification !== 'awaiting') throw new AppError('conflict', 409, MSG.alreadyChecked)

  const entry = { reason: text, on: shortDate(), at: new Date() }
  const set = { verification: 'none', sentBack: { reason: entry.reason, on: entry.on } }
  // A reopened issue goes to the department for the first time, so it must stop
  // being "reopened" (the department list and Start work skip those). Its
  // priority before it was reopened was not kept, so it becomes High.
  if (issue.priority === 'reopened') set.priority = 'high'

  const updated = await Issue.findOneAndUpdate(
    { _id: issue._id, verification: 'awaiting' },
    { $set: set, $unset: { pendingAfterImg: 1 }, $push: { sentBackHistory: entry } },
    { returnDocument: 'after' },
  ).lean()
  if (!updated) throw new AppError('conflict', 409, MSG.alreadyChecked)

  const why = reasonSentence(text)
  await tellReporter(updated, 'sent-back', MSG.sentBackForReporter(updated.title, why))
  await tellDepartment(
    updated,
    'sent-back',
    MSG.sentBackForDepartment(updated.title, why),
    '/department?status=in-progress',
  )
  return toIssueJSON(updated)
}

// A reopened issue goes to the verification queue, where Approve keeps the fix
// and Reject sends it to the department with a reason. Its priority stays
// 'reopened' until the admin decides.
export async function sendToQueue(id) {
  const issue = await findIssue(id)
  if (issue.verification !== 'reopened') throw new AppError('conflict', 409, MSG.notReopened)

  const now = new Date()
  const updated = await Issue.findOneAndUpdate(
    { _id: issue._id, verification: 'reopened' },
    { $set: { verification: 'awaiting', submittedAt: now, submittedOn: shortDate(now) } },
    { returnDocument: 'after' },
  ).lean()
  if (!updated) throw new AppError('conflict', 409, MSG.notReopened)
  return staffView(updated)
}
