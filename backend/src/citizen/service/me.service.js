// "Me" and points. Points are never stored: 60 x number of reports filed.
import Issue from '../../models/issue.model.js'
import User from '../../models/user.model.js'
import { summaryFor } from '../../utils/points.js'

const clean = (email) => String(email).trim().toLowerCase()

export async function getMe(email) {
  const [user, reports] = await Promise.all([
    User.findOne({ email: clean(email) }).select('name').lean(),
    Issue.countDocuments({ reporterEmail: clean(email) }),
  ])
  return { email: clean(email), name: user?.name ?? '', reports, ...summaryFor(reports) }
}

export async function getPoints(email) {
  const reports = await Issue.countDocuments({ reporterEmail: clean(email) })
  return summaryFor(reports)
}