// The four Home endpoints. Open to everyone, so nothing here depends on who is
// looking. The figures come from the shared stats service, the same one the
// admin Accountability page uses, so the two screens can never disagree.
import Issue from '../../models/issue.model.js'
import { getHomeStats } from '../../shared/service/stats.service.js'
import { PUBLIC_FIELDS, toIssueJSON, voteCounts } from '../../shared/service/issues.service.js'
import { HERO_CATEGORIES, HERO_SLIDES, HOME_LIMITS } from '../../constants/home.js'

// "Just now", "5 min ago", "3 hours ago", "Yesterday", "4 days ago": the same
// words the Home ticker shows today.
export function timeAgo(from, now = new Date()) {
  const minutes = Math.floor((now.getTime() - new Date(from).getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

// Static text, no database.
export function getHero() {
  return { slides: HERO_SLIDES, categories: HERO_CATEGORIES }
}

// The latest fixed issues that have an after-photo (a reopened issue approved
// again may have none). Newest fix first.
export async function getFixedThisWeek() {
  const issues = await Issue.find({ status: 'resolved', afterImg: { $nin: [null, ''] } })
    .sort({ resolvedAt: -1, _id: -1 })
    .limit(HOME_LIMITS.fixedCount)
    .select(PUBLIC_FIELDS)
    .lean()
  const counts = await voteCounts(issues.map((issue) => issue._id))
  return issues.map((issue) => toIssueJSON(issue, { votes: counts.get(String(issue._id)) ?? 0 }))
}

// Newest reports first, for the ticker.
export async function getActivity(limit = HOME_LIMITS.activityDefault) {
  const issues = await Issue.find({})
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .select('title status createdAt')
    .lean()
  const now = new Date()
  return issues.map((issue) => ({
    id: String(issue._id),
    title: issue.title,
    status: issue.status,
    time: timeAgo(issue.createdAt, now),
    createdAt: new Date(issue.createdAt).toISOString(),
  }))
}

// The four stat cards, always for the last 8 weeks.
export async function getStats() {
  return getHomeStats()
}
