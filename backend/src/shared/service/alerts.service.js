import Alert from '../../models/alert.model.js'

// The ONLY place that writes alerts. Citizen, department and admin code all
// call these three functions and never touch the Alert model themselves.

// Newest alerts kept per account. Move to the alerts block of constants/limits.js
// when the kit has it.
const KEEP_NEWEST = 50

const clean = (email) => String(email).trim().toLowerCase()

// Deletes everything past the newest KEEP_NEWEST for one account.
async function trimToNewest(recipient) {
  const stale = await Alert.find({ recipient })
    .sort({ createdAt: -1, _id: -1 })
    .skip(KEEP_NEWEST)
    .select('_id')
    .lean()
  if (stale.length > 0) {
    await Alert.deleteMany({ _id: { $in: stale.map((alert) => alert._id) } })
  }
}

// One notice for one person.
// payload: { kind, text, link?, issueId? }
export async function notify(recipient, { kind, text, link = '', issueId = null }) {
  const to = clean(recipient)
  const alert = await Alert.create({ recipient: to, kind, text, link, issueId })
  await trimToNewest(to)
  return alert
}

// The same notice for many people (for example a department's staff).
export async function notifyMany(recipients, { kind, text, link = '', issueId = null }) {
  const unique = [...new Set(recipients.map(clean))]
  if (unique.length === 0) return []
  const made = await Alert.insertMany(
    unique.map((to) => ({ recipient: to, kind, text, link, issueId })),
  )
  await Promise.all(unique.map(trimToNewest))
  return made
}

// When an issue is deleted, every alert about it goes, for every account.
export async function removeForIssue(issueId) {
  await Alert.deleteMany({ issueId })
}
