// "Me" and points. Points are never stored: 60 x number of reports filed.
import Issue from '../../models/issue.model.js'
import { summaryFor } from '../../utils/points.js'

const clean = (email) => String(email).trim().toLowerCase()

export async function getMe(email) {
  const reports = await Issue.countDocuments({ reporterEmail: clean(email) })
  return { email: clean(email), reports, ...summaryFor(reports) }
}

export async function getPoints(email) {
  const reports = await Issue.countDocuments({ reporterEmail: clean(email) })
  return summaryFor(reports)
}