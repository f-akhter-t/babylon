// A citizen says "this fixed problem came back".
//
// Lifecycle (the contract with Meheri's admin panel): the SAME issue goes back
// to the admin. verification becomes 'reopened', priority 'reopened', and
// reopenedAt is set. status stays 'resolved' until the admin sends it on
// (send-to-queue) or back to the department. Nothing is copied or deleted.
//
// Any signed-in citizen can reopen a resolved issue, not only the one who
// filed it: neighbours see the problem come back too. The filter in the update
// names the state we expect, so two quick clicks cannot both win.
import mongoose from 'mongoose'
import AppError from '../../utils/AppError.js'
import { ROLES } from '../../constants/roles.js'
import { MSG } from '../../constants/messages/index.js'

// Loaded on first use, so the rules can be tested without a database.
async function loadDeps() {
  const [issue, user, alerts] = await Promise.all([
    import('../../models/issue.model.js'),
    import('../../models/user.model.js'),
    import('../../shared/service/alerts.service.js'),
  ])
  return { Issue: issue.default, User: user.default, notify: alerts.notify, notifyMany: alerts.notifyMany }
}

// A notice that fails must not undo work that is already saved.
async function tell(send) {
  try {
    await send()
  } catch (err) {
    console.error('Could not send a notice:', err.message)
  }
}

const same = (a, b) => String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase()

export function createReopenService({ getDeps = loadDeps, now = () => new Date() } = {}) {
  return {
    // user: req.user. -> { id, status, priority, verification, reopenedAt }
    async reopenReport(user, id) {
      if (!mongoose.isValidObjectId(id)) throw new AppError('not-found', 404, MSG.reopenGone)
      const { Issue, User, notify, notifyMany } = await getDeps()

      const issue = await Issue.findById(id).select('title status verification reporterEmail').lean()
      if (!issue) throw new AppError('not-found', 404, MSG.reopenGone)
      if (issue.status !== 'resolved') throw new AppError('conflict', 409, MSG.reopenNotResolved)
      if (issue.verification === 'reopened') throw new AppError('conflict', 409, MSG.reopenAlready)

      const reopenedAt = now()
      const updated = await Issue.findOneAndUpdate(
        { _id: issue._id, status: 'resolved', verification: { $ne: 'reopened' } },
        { $set: { verification: 'reopened', priority: 'reopened', reopenedAt } },
        { returnDocument: 'after' },
      )
        .select('title status priority verification reporterEmail reopenedAt')
        .lean()
      if (!updated) throw new AppError('conflict', 409, MSG.reopenAlready)

      const issueId = String(updated._id)
      await tell(async () => {
        const admins = await User.find({ role: ROLES.ADMIN }).distinct('email')
        await notifyMany(admins, {
          kind: 'reopen',
          text: MSG.reopenForAdmin(updated.title),
          link: '/admin/verify',
          issueId,
        })
      })
      // The person who filed it hears about it too, unless they did it themselves.
      if (updated.reporterEmail && !same(updated.reporterEmail, user.email)) {
        await tell(() =>
          notify(updated.reporterEmail, {
            kind: 'reopen',
            text: MSG.reopenForReporter(updated.title),
            link: `/my-reports?report=${issueId}`,
            issueId,
          }),
        )
      }

      return {
        id: issueId,
        status: updated.status,
        priority: updated.priority,
        verification: updated.verification,
        reopenedAt: updated.reopenedAt,
      }
    },
  }
}

export const { reopenReport } = createReopenService()
