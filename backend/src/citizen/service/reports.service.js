// Every rule and every database call for citizen reports lives here.
// The shape of the request is checked by citizen.schemas.js before it gets here.
import mongoose from 'mongoose'
import Issue from '../../models/issue.model.js'
import Vote from '../../models/vote.model.js'
import User from '../../models/user.model.js'
import AppError from '../../utils/AppError.js'
import { notify, notifyMany, removeForIssue } from '../../shared/service/alerts.service.js'
import { toIssueJSON, voteCounts, votedIssueIds } from '../../shared/service/issues.service.js'
import { crossesLevel, levelFor, pointsFor } from '../../utils/points.js'
import { departmentForCategory } from '../../constants/departments.js'
import { ROLES } from '../../constants/roles.js'
import { MESSAGES } from '../../constants/messages/citizen.js'
import { photoFields } from './severity.hook.js'

const clean = (email) => String(email).trim().toLowerCase()

// A short title from the first sentence, as the frontend does today.
function makeTitle(description) {
  const first = description.split(/[.!?\n]/)[0].trim()
  if (!first) return 'New report'
  const title = first.length > 70 ? `${first.slice(0, 67).trimEnd()}...` : first
  return title.charAt(0).toUpperCase() + title.slice(1)
}

// The owner's view of their own reports: the shared issue JSON plus the
// history of fixes sent back.
async function toMyReports(issues, email) {
  const plain = issues.map((issue) => (typeof issue.toObject === 'function' ? issue.toObject() : issue))
  const ids = plain.map((issue) => issue._id)
  const [counts, voted] = await Promise.all([voteCounts(ids), votedIssueIds(ids, email)])
  return plain.map((issue) => {
    const json = toIssueJSON(issue, {
      votes: counts.get(String(issue._id)) ?? 0,
      voted: voted.has(String(issue._id)),
      mine: true,
    })
    const history = issue.sentBackHistory ?? (issue.sentBack ? [issue.sentBack] : [])
    return {
      ...json,
      sentBackHistory: history.map(({ reason, on }) => ({ reason, on })),
      sentBackNow: Boolean(issue.sentBack),
    }
  })
}

// D1: the same rule as the frontend's checkReportDivision. The citizen's
// division comes from the account, never from the request.
async function citizenDivisionFor(email, pinDivision) {
  const user = await User.findOne({ email: clean(email) }).select('division').lean()
  const mine = user?.division ?? ''
  if (!mine) throw new AppError('invalid', 400, MESSAGES.DIVISION_MISSING, 'location')
  if (!pinDivision) throw new AppError('invalid', 400, MESSAGES.DIVISION_UNKNOWN, 'location')
  if (pinDivision !== mine) {
    throw new AppError('invalid', 400, MESSAGES.divisionMismatch(mine, pinDivision), 'location')
  }
  return mine
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

// D2: tell the staff of the department that handles this category.
// "Other" has no department, so nobody is told.
async function notifyDepartment(issue) {
  const department = departmentForCategory(issue.category)
  if (!department) return
  const staff = await User.find({ role: ROLES.DEPARTMENT, department }).select('email').lean()
  if (staff.length === 0) return
  await notifyMany(
    staff.map((member) => member.email),
    {
      kind: 'new-report',
      text: MESSAGES.newReport(issue.title),
      link: `/issues/${issue._id}`,
      issueId: issue._id,
    },
  )
}

export async function createReport(email, input) {
  const { category, description, photoUrl, location } = input
  const division = await citizenDivisionFor(email, location.division)
  const title = input.title ?? makeTitle(description)

  const before = await Issue.countDocuments({ reporterEmail: clean(email) })

  // F1: the photo's priority from AI. Never throws: { priority: 'medium' } when AI is off.
  const ai = await photoFields(photoUrl)

  const issue = await Issue.create({
    title,
    category,
    description,
    beforeImg: photoUrl,
    lat: location.lat,
    lng: location.lng,
    location: location.label,
    ward: location.ward ?? '',
    division,
    status: 'open',
    verification: 'none',
    priority: 'medium',
    ...ai, // must come after priority: overrides it when AI scored the photo
    reporterEmail: clean(email),
  })

  await Vote.create({ issueId: issue._id, userEmail: clean(email) }) // the reporter's own vote
  await notify(email, {
    kind: 'filed',
    text: MESSAGES.reportFiled(issue.title),
    link: '/my-reports',
    issueId: issue._id,
  })

  if (crossesLevel(before, before + 1)) {
    const { level, role } = levelFor(pointsFor(before + 1))
    await notify(email, {
      kind: 'level-up',
      text: MESSAGES.levelUp(level, role),
      link: '/my-reports',
    })
  }
  await notifyDepartment(issue)

  const [report] = await toMyReports([issue], email)
  return report
}

export async function listMyReports(email) {
  const issues = await Issue.find({ reporterEmail: clean(email) }).sort({ createdAt: -1, _id: -1 })
  return toMyReports(issues, email)
}

export async function getMyReport(email, id) {
  const [report] = await toMyReports([await findOwned(email, id)], email)
  return report
}

export async function updateReport(email, id, input) {
  const issue = await findOwned(email, id)
  assertOpen(issue)

  // The division rule only applies when the pin moves.
  const division = input.location
    ? await citizenDivisionFor(email, input.location.division)
    : issue.division
  const location = input.location ?? {
    lat: issue.lat,
    lng: issue.lng,
    label: issue.location,
    ward: issue.ward,
  }

  issue.set({
    title: input.title ?? issue.title,
    category: input.category ?? issue.category,
    description: input.description ?? issue.description,
    beforeImg: input.photoUrl ?? issue.beforeImg,
    lat: location.lat,
    lng: location.lng,
    location: location.label,
    ward: location.ward ?? '',
    division,
    editedAt: new Date(),
  })
  await issue.save()
  const [report] = await toMyReports([issue], email)
  return report
}

export async function deleteReport(email, id) {
  const issue = await findOwned(email, id)
  assertOpen(issue)

  await Vote.deleteMany({ issueId: issue._id })
  await removeForIssue(issue._id)
  await issue.deleteOne()
  return { id: String(issue._id) }
}