import mongoose from 'mongoose'
import Alert from '../../models/alert.model.js'
import AppError from '../../utils/AppError.js'
import { ALERT_LIMITS } from '../../constants/limits.js'
import { MESSAGES } from '../../constants/messages/citizen.js'

// The ONLY place that reads and writes alerts. Citizen, department and admin
// code all call these functions and never touch the Alert model themselves.
// Writing: notify, notifyMany, removeForIssue.
// Reading (for any role, always for the signed-in person's own email):
//   listAlerts, getUnreadCount, markRead, markAllRead.

const clean = (email) => String(email).trim().toLowerCase()

// Deletes everything past the newest ALERT_LIMITS.keepNewest for one account.
async function trimToNewest(recipient) {
  const stale = await Alert.find({ recipient })
    .sort({ createdAt: -1, _id: -1 })
    .skip(ALERT_LIMITS.keepNewest)
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

// ---------- Reading and marking, for any role ----------
// The email always comes from the token, never from the request.

function toAlertJSON(alert) {
  return {
    id: String(alert._id),
    kind: alert.kind,
    text: alert.text,
    link: alert.link,
    issueId: alert.issueId ? String(alert.issueId) : null,
    createdAt: alert.createdAt,
    read: alert.read,
  }
}

const unreadCountFor = (email) => Alert.countDocuments({ recipient: clean(email), read: false })

export async function listAlerts(email) {
  const alerts = await Alert.find({ recipient: clean(email) })
    .sort({ createdAt: -1, _id: -1 })
    .lean()
  return { alerts: alerts.map(toAlertJSON), unreadCount: await unreadCountFor(email) }
}

export async function getUnreadCount(email) {
  return { unreadCount: await unreadCountFor(email) }
}

// Someone else's notice, or an unknown id, is a 404.
export async function markRead(email, id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('not-found', 404, MESSAGES.ALERT_NOT_FOUND)
  }
  const alert = await Alert.findOneAndUpdate(
    { _id: id, recipient: clean(email) },
    { $set: { read: true } },
    { new: true },
  ).lean()
  if (!alert) throw new AppError('not-found', 404, MESSAGES.ALERT_NOT_FOUND)
  return toAlertJSON(alert)
}

export async function markAllRead(email) {
  await Alert.updateMany({ recipient: clean(email), read: false }, { $set: { read: true } })
  return { unreadCount: 0 }
}
