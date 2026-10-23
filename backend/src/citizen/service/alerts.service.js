// A citizen reads and marks their OWN notices. Notices are created only by
// shared/service/alerts.service.js.
import mongoose from 'mongoose'
import Alert from '../../models/alert.model.js'
import AppError from '../../utils/AppError.js'
import { MESSAGES } from '../../constants/messages/citizen.js'

const clean = (email) => String(email).trim().toLowerCase()

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