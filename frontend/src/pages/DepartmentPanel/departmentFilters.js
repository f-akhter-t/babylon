// The Department panel's views, chosen with ?status= in the URL so the same
// links work from the sidebar, a top bar or a bookmark.
// No value, or one that is not listed here, shows every assigned issue.
export const DEPARTMENT_FILTERS = {
  open: { label: 'Open', matches: (issue) => issue.status === 'open' },
  'in-progress': {
    label: 'In progress',
    matches: (issue) => issue.status === 'in-progress' && issue.verification !== 'awaiting',
  },
  awaiting: {
    label: 'Awaiting verification',
    matches: (issue) => issue.verification === 'awaiting',
  },
  completed: { label: 'Completed' }, // a separate list: resolved issues
}

export const ALL_ASSIGNED_LABEL = 'Assigned issues'

export function filterFor(status) {
  return Object.hasOwn(DEPARTMENT_FILTERS, status) ? status : null
}

// assigned: getDepartmentIssues(), completed: getCompletedDepartmentIssues().
// Ranks stay as the full list gave them.
export function issuesFor(status, assigned, completed) {
  const key = filterFor(status)
  if (!key) return assigned
  if (key === 'completed') return completed
  return assigned.filter(DEPARTMENT_FILTERS[key].matches)
}

// The admin's reason for sending a fix back, as one sentence (issue.sentBack
// from the API: { reason, on }). Shown in the table and the Resolve panel.
export function sentBackMessage(sentBack, t) {
  return t('The admin sent this back on {date}. Reason: {reason}', { date: sentBack.on, reason: sentBack.reason })
}

// Search and sort for the table (see hooks/useListView.js). Kept here, at module
// level, so they never change between renders.
export const issueText = (issue) => [issue.title, issue.location, issue.ward, issue.department].filter(Boolean).join(' ')

const created = (issue) => Date.parse(issue.createdAt) || 0

export const ISSUE_SORTS = {
  priority: { label: 'Priority', compare: null }, // the server's order
  oldest: { label: 'Oldest first', compare: (a, b) => created(a) - created(b) },
  newest: { label: 'Newest first', compare: (a, b) => created(b) - created(a) },
  votes: { label: 'Most votes', compare: (a, b) => b.votes - a.votes },
}

// Whole days since the report was made, or null when the date is missing.
export function waitingDays(issue, now = Date.now()) {
  const made = Date.parse(issue.createdAt)
  if (!made) return null
  return Math.max(0, Math.floor((now - made) / 86400000))
}
