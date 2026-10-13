// The Department panel's views, chosen with ?status= in the URL so the same
// links work from the sidebar, a top bar or a bookmark.
// No value, or one that is not listed here, shows every assigned issue.
export const DEPARTMENT_FILTERS = {
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
