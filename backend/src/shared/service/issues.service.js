// Public, citizen, department and admin all read issues through this file, so
// an issue always looks the same and nobody writes their own issue query.
// The pure parts (toIssueJSON, buildIssueFilter) live in utils/issueView.js.
import mongoose from 'mongoose'
import Issue from '../../models/issue.model.js'
import Vote from '../../models/vote.model.js'
import AppError from '../../utils/AppError.js'
import { rankIssues } from '../../utils/rankIssues.js'
import { buildIssueFilter, toIssueJSON } from '../../utils/issueView.js'
import { COMMON } from '../../constants/messages/common.js'

// The other panels import toIssueJSON from here.
export { toIssueJSON, buildIssueFilter }

// pendingAfterImg is a big photo and departmentNote is staff-only: the public
// views never need them.
export const PUBLIC_FIELDS = '-pendingAfterImg -departmentNote -imageEmbedding'

const clean = (email) => String(email).trim().toLowerCase()

// ---------- Votes ----------

// Map of issue id (text) to its number of votes, counted from the Vote rows.
export async function voteCounts(issueIds) {
  if (issueIds.length === 0) return new Map()
  const rows = await Vote.aggregate([
    { $match: { issueId: { $in: issueIds } } },
    { $group: { _id: '$issueId', count: { $sum: 1 } } },
  ])
  return new Map(rows.map((row) => [String(row._id), row.count]))
}

// Set of issue ids (text) this person has voted on.
export async function votedIssueIds(issueIds, email) {
  if (!email || issueIds.length === 0) return new Set()
  const rows = await Vote.find({ issueId: { $in: issueIds }, userEmail: clean(email) })
    .select('issueId')
    .lean()
  return new Set(rows.map((row) => String(row.issueId)))
}

// ---------- Reading issues ----------

// One issue as a plain object. A bad or unknown id is a 404 (never a 500).
export async function findIssueById(id, fields = PUBLIC_FIELDS) {
  if (!mongoose.isValidObjectId(id)) throw new AppError('not-found', 404, COMMON.notFound)
  const issue = await Issue.findById(id).select(fields).lean()
  if (!issue) throw new AppError('not-found', 404, COMMON.notFound)
  return issue
}

// The ranked public list. Filters: category, status, search (see buildIssueFilter).
//   from         [lat, lng] of the viewer: adds distanceM to every item
//   viewerEmail  from the token (optional): adds voted and mine
// Every item gets its rank (1 to n), the way the Feed shows it.
export async function listIssues({ category, status, search, from, viewerEmail } = {}) {
  const issues = await Issue.find(buildIssueFilter({ category, status, search }))
    .select(PUBLIC_FIELDS)
    .lean()

  const ids = issues.map((issue) => issue._id)
  const [counts, voted] = await Promise.all([voteCounts(ids), votedIssueIds(ids, viewerEmail)])
  const viewer = viewerEmail ? clean(viewerEmail) : null

  const items = issues.map((issue) =>
    toIssueJSON(issue, {
      votes: counts.get(String(issue._id)) ?? 0,
      from,
      ...(viewer ? { voted: voted.has(String(issue._id)), mine: issue.reporterEmail === viewer } : {}),
    }),
  )
  return rankIssues(items).map((item, index) => ({ ...item, rank: index + 1 }))
}

// One issue for the detail page. The owner (the token's email, never a value
// from the request) also gets the history of fixes sent back to the department.
export async function getIssueDetail(id, { from, viewerEmail } = {}) {
  const issue = await findIssueById(id)
  const [counts, voted] = await Promise.all([voteCounts([issue._id]), votedIssueIds([issue._id], viewerEmail)])
  const viewer = viewerEmail ? clean(viewerEmail) : null
  const owner = Boolean(viewer) && issue.reporterEmail === viewer

  const json = toIssueJSON(issue, {
    votes: counts.get(String(issue._id)) ?? 0,
    from,
    ...(viewer ? { voted: voted.has(String(issue._id)), mine: owner } : {}),
  })
  if (!owner) return json

  // Reports sent back before the history existed only have the latest reason.
  const history = issue.sentBackHistory ?? (issue.sentBack ? [issue.sentBack] : [])
  return {
    ...json,
    sentBackHistory: history.map(({ reason, on }) => ({ reason, on })),
    sentBackNow: Boolean(issue.sentBack),
  }
}
