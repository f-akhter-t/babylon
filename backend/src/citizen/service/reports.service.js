// Every rule and every database call for citizen reports lives here.
import mongoose from 'mongoose'
import Issue from '../../models/issue.model.js'
import Vote from '../../models/vote.model.js'
import AppError from '../../utils/AppError.js'
import { notify, removeForIssue } from '../../shared/service/alerts.service.js'
import { crossesLevel, levelFor, pointsFor } from '../../utils/points.js'
import { CATEGORIES, CITIZEN_LIMITS } from '../../constants/limits.js'
import { MESSAGES } from '../../constants/messages/citizen.js'

const clean = (email) => String(email).trim().toLowerCase()

// A short title from the first sentence, as the frontend does today.
function makeTitle(description) {
  const first = description.split(/[.!?\n]/)[0].trim()
  if (!first) return 'New report'
  const title = first.length > 70 ? `${first.slice(0, 67).trimEnd()}...` : first
  return title.charAt(0).toUpperCase() + title.slice(1)
}

// TEMP: replace with toIssueJSON from shared/service/issues.service.js (Farhana's kit).
async function toReportJSON(issue) {
  const votes = await Vote.countDocuments({ issueId: issue._id })
  const { _id, __v, ...rest } = issue.toObject()
  return { id: String(_id), ...rest, votes }
}

// Every rule is checked here again, like a real backend, even if the form checked it.
function check({ category, description, photoUrl, location } = {}) {
  if (typeof photoUrl !== 'string' || !photoUrl.startsWith('data:image/')) {
    throw new AppError('invalid', 400, MESSAGES.PHOTO_REQUIRED, 'photoUrl')
  }
  if (!CATEGORIES.includes(category)) {
    throw new AppError('invalid', 400, MESSAGES.CATEGORY_INVALID, 'category')
  }
  const text = (description ?? '').trim()
  if (text.length < CITIZEN_LIMITS.description.min || text.length > CITIZEN_LIMITS.description.max) {
    throw new AppError('invalid', 400, MESSAGES.DESCRIPTION_INVALID, 'description')
  }
  const ok =
    location &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng) &&
    typeof location.label === 'string' &&
    location.label.trim() !== ''
  if (!ok) throw new AppError('invalid', 400, MESSAGES.LOCATION_INVALID, 'location')
  return text
}

// Unknown id -> 404. Someone else's report -> 403.
async function findOwned(email, id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('not-found', 404, MESSAGES.REPORT_NOT_FOUND)
  }
  const issue = await Issue.findById(id)
  if (!issue) throw new AppError('not-found', 404, MESSAGES.REPORT_NOT_FOUND)
  if (issue.reporterEmail !== clean(email)) {
    throw new AppError('forbidden', 403, MESSAGES.REPORT_FORBIDDEN)
  }
  return issue
}

function assertOpen(issue) {
  if (issue.status !== 'open') throw new AppError('locked', 423, MESSAGES.REPORT_LOCKED)
}

export async function createReport(email, input = {}) {
  const description = check(input)
  const { category, photoUrl, location } = input

  const before = await Issue.countDocuments({ reporterEmail: email })

  const issue = await Issue.create({
    title: makeTitle(description),
    category,
    description,
    beforeImg: photoUrl,
    lat: location.lat,
    lng: location.lng,
    location: location.label.trim(),
    ward: location.ward ?? '',
    status: 'open',
    verification: 'none',
    priority: 'medium', // AI severity scoring plugs in here later (one clear hook)
    reporterEmail: email,
  })

  await Vote.create({ issueId: issue._id, userEmail: email }) // the reporter's own vote
  await notify(email, { kind: 'filed', text: MESSAGES.REPORT_FILED, issueId: issue._id })

  if (crossesLevel(before, before + 1)) {
    const { role } = levelFor(pointsFor(before + 1))
    await notify(email, { kind: 'level-up', text: MESSAGES.levelUp(role) })
  }
  // TODO: notify the department's staff (kind 'new-report') once user.model exists.

  return toReportJSON(issue)
}

export async function listMyReports(email) {
  const issues = await Issue.find({ reporterEmail: clean(email) }).sort({ createdAt: -1, _id: -1 })
  return Promise.all(issues.map(toReportJSON))
}

export async function getMyReport(email, id) {
  return toReportJSON(await findOwned(email, id))
}

export async function updateReport(email, id, input = {}) {
  const issue = await findOwned(email, id)
  assertOpen(issue)

  // Fields not sent keep their current value.
  const merged = {
    category: input.category ?? issue.category,
    description: input.description ?? issue.description,
    photoUrl: input.photoUrl ?? issue.beforeImg,
    location: input.location ?? {
      lat: issue.lat,
      lng: issue.lng,
      label: issue.location,
      ward: issue.ward,
    },
  }
  const description = check(merged)

  issue.set({
    title: makeTitle(description),
    category: merged.category,
    description,
    beforeImg: merged.photoUrl,
    lat: merged.location.lat,
    lng: merged.location.lng,
    location: merged.location.label.trim(),
    ward: merged.location.ward ?? '',
    editedAt: new Date(),
  })
  await issue.save()
  return toReportJSON(issue)
}

export async function deleteReport(email, id) {
  const issue = await findOwned(email, id)
  assertOpen(issue)

  await Vote.deleteMany({ issueId: issue._id })
  await removeForIssue(issue._id)
  await issue.deleteOne()
  return { id: String(issue._id) }
}