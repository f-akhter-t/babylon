// Turns an issue from services/api.js into what the My reports cards need.
// api.js uses status 'open' | 'in-progress' | 'resolved' and priority/verification flags.

const DAY = 86400000

export function reportStatus(issue) {
  if (issue.priority === 'reopened' || issue.verification === 'reopened') return 'reopened'
  if (issue.status === 'resolved') return 'resolved'
  if (issue.status === 'in-progress') return 'in_progress'
  return 'open'
}

const reportedAt = (issue) => issue.createdAt ?? Date.now() - (issue.daysAgo ?? 0) * DAY

export function timeAgo(ts) {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

function updateText(issue, status) {
  if (status === 'reopened') return 'Reopened and sent to the admin'
  if (status === 'resolved') return 'Fix verified by admin'
  if (issue.verification === 'awaiting') return 'Waiting for the admin to check the fix'
  if (status === 'in_progress') return 'Work in progress'
  return `Waiting for work to start · ${timeAgo(reportedAt(issue))}`
}

function buildHistory(issue, status) {
  const steps = [{ label: 'Open', note: `Reported ${issue.reportedOn ?? ''}`.trim() }]
  if (issue.department) steps.push({ label: `Sent to ${issue.department}`, note: issue.sentOn })
  if (status !== 'open') steps.push({ label: 'In progress' })
  if (issue.verification === 'awaiting') steps.push({ label: 'Awaiting admin check' })
  if (status === 'resolved' || status === 'reopened') {
    steps.push({ label: 'Resolved', note: 'After-photo verified by admin' })
  }
  if (status === 'reopened') steps.push({ label: 'Reopened', note: 'Sent to the admin' })
  return steps
}

export function toReportView(issue) {
  const status = reportStatus(issue)
  const place = [issue.location, issue.ward && !issue.location?.includes(issue.ward) ? issue.ward : '']
    .filter(Boolean)
    .join(', ')
  return {
    id: issue.id,
    title: issue.title,
    category: issue.category,
    location: place,
    photoUrl: issue.beforeImg || null,
    status,
    upvotes: issue.votes ?? 0,
    department: issue.department ?? null,
    dateLabel: issue.reportedOn ?? '',
    description: issue.description ?? '',
    updateText: updateText(issue, status),
    history: buildHistory(issue, status),
  }
}
