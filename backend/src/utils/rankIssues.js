import { PRIORITIES } from '../constants/limits.js'

// The ONE ranking rule for every list in the app:
//   1. priority: urgent, high, reopened, medium, fix-verified
//   2. votes, most first
//   3. the newer report first, so the order never jumps around between calls
//
// It returns a NEW sorted array and does not add a rank number. Whoever shows
// the list does that: ranked.map((item, i) => ({ ...item, rank: i + 1 })).
// Items need `priority` and `votes`; `createdAt` is optional.
const priorityOrder = (priority) => {
  const index = PRIORITIES.indexOf(priority)
  return index === -1 ? PRIORITIES.length : index
}

const createdTime = (issue) => {
  const time = issue.createdAt ? new Date(issue.createdAt).getTime() : 0
  return Number.isNaN(time) ? 0 : time
}

export function rankIssues(list) {
  return [...list].sort(
    (a, b) =>
      priorityOrder(a.priority) - priorityOrder(b.priority) ||
      (b.votes ?? 0) - (a.votes ?? 0) ||
      createdTime(b) - createdTime(a),
  )
}

export default rankIssues
