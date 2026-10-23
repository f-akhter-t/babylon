import mongoose from 'mongoose'
import Issue from '../../models/issue.model.js'
import User from '../../models/user.model.js'
import AppError from '../../utils/AppError.js'
import { shortDate } from '../../utils/dates.js'
import { rankIssues } from '../../utils/rankIssues.js'
import { ROLES } from '../../constants/roles.js'
import { MSG } from '../../constants/messages/index.js'
import { toIssueJSON } from '../../shared/service/issues.service.js'
import { notify, notifyMany } from '../../shared/service/alerts.service.js'
import { departmentOfIssue, isReopened, loadScope, requireDepartment } from './scope.js'

// What the department pages read: the public issue plus two staff details.
const staffView = (issue) => ({
  ...toIssueJSON(issue),
  departmentNote: issue.departmentNote ?? null,
  sentBack: issue.sentBack?.reason ? { reason: issue.sentBack.reason, on: issue.sentBack.on } : null,
})

// A notice that fails must not undo work that is already saved.
async function tell(send) {
  try {
    await send()
  } catch (err) {
    console.error('Could not send a notice:', err.message)
  }
}

async function findOwnedIssue(user, id) {
  const department = requireDepartment(user)
  if (!mongoose.isValidObjectId(id)) throw new AppError('not-found', 404, MSG.deptIssueGone)
  const issue = await Issue.findById(id).select('-pendingAfterImg').lean()
  if (!issue) throw new AppError('not-found', 404, MSG.deptIssueGone)
  if (departmentOfIssue(issue) !== department) throw new AppError('forbidden', 403, MSG.deptNotYours)
  return issue
}

// ---------- List ----------

export async function listIssues(user, scope) {
  const department = requireDepartment(user)
  // pendingAfterImg is a big photo. The list does not need it.
  const issues = await loadScope(department, scope, '-pendingAfterImg -beforeImg')
  return rankIssues(issues.map(staffView)).map((item, index) => ({ ...item, rank: index + 1 }))
}

// ---------- Start work ----------

export async function startWork(user, id) {
  const issue = await findOwnedIssue(user, id)
  if (isReopened(issue)) throw new AppError('conflict', 409, MSG.deptIsReopened)
  if (issue.status !== 'open') throw new AppError('conflict', 409, MSG.deptAlreadyStarted)

  // The filter names the state we expect, so two quick clicks cannot both win.
  const updated = await Issue.findOneAndUpdate(
    { _id: issue._id, status: 'open' },
    { $set: { status: 'in-progress', startedAt: new Date() } },
    { returnDocument: 'after' },
  )
    .select('-pendingAfterImg')
    .lean()
  if (!updated) throw new AppError('conflict', 409, MSG.deptAlreadyStarted)

  if (updated.reporterEmail) {
    await tell(() =>
      notify(updated.reporterEmail, {
        kind: 'in-progress',
        text: MSG.deptStartedForReporter(updated.title),
        link: `/my-reports?report=${updated._id}`,
        issueId: String(updated._id),
      }),
    )
  }
  return staffView(updated)
}

// ---------- Submit for verification ----------

export async function submitFix(user, id, { note, photoUrl }) {
  const issue = await findOwnedIssue(user, id)
  if (isReopened(issue)) throw new AppError('conflict', 409, MSG.deptIsReopened)
  if (issue.status !== 'in-progress') throw new AppError('conflict', 409, MSG.deptNotStarted)
  if (issue.verification === 'awaiting') throw new AppError('conflict', 409, MSG.deptAlreadySubmitted)

  const now = new Date()
  // In progress and verification "none" means: started, and not waiting or reopened.
  const updated = await Issue.findOneAndUpdate(
    { _id: issue._id, status: 'in-progress', verification: 'none' },
    {
      $set: {
        verification: 'awaiting',
        pendingAfterImg: photoUrl,
        departmentNote: note,
        submittedAt: now,
        submittedOn: shortDate(now),
      },
    },
    { returnDocument: 'after' },
  )
    .select('-pendingAfterImg')
    .lean()
  if (!updated) throw new AppError('conflict', 409, MSG.deptAlreadySubmitted)

  const issueId = String(updated._id)
  if (updated.reporterEmail) {
    await tell(() =>
      notify(updated.reporterEmail, {
        kind: 'fix-submitted',
        text: MSG.deptSubmittedForReporter(updated.title),
        link: `/my-reports?report=${issueId}`,
        issueId,
      }),
    )
  }
  await tell(async () => {
    const admins = await User.find({ role: ROLES.ADMIN }).distinct('email')
    await notifyMany(admins, { kind: 'fix-waiting', text: MSG.deptSubmittedForAdmin(updated.title), link: '/admin', issueId })
  })
  return staffView(updated)
}