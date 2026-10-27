import { canEditIssue } from '../../services/api'

// Turns an issue from services/api.js into what the My reports cards need.
// api.js uses status 'open' | 'in-progress' | 'resolved' and priority/verification flags.

const DAY = 86400000

export function reportStatus(issue) {
  if (issue.priority === 'reopened' || issue.verification === 'reopened') return 'reopened'
  if (issue.status === 'resolved') return 'resolved'
  if (issue.status === 'in-progress') return 'in_progress'
  return 'open'
}

// createdAt is a number or a date text (the server sends text).
const reportedAt = (issue) =>
  issue.createdAt ? new Date(issue.createdAt).getTime() : Date.now() - (issue.daysAgo ?? 0) * DAY

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
  // Only while it is sent back right now; the reason is in the details.
  if (issue.sentBackNow) return "The department's fix was sent back."
  if (status === 'in_progress') return 'Work in progress'
  return `Waiting for work to start · ${timeAgo(reportedAt(issue))}`
}

function buildHistory(issue, status) {
  const steps = [{ label: 'Open', note: `Reported ${issue.reportedOn ?? ''}`.trim() }]
  if (issue.department) steps.push({ label: `Sent to ${issue.department}`, note: issue.sentOn })
  if (status !== 'open') steps.push({ label: 'In progress' })
  // Every time the admin sent the fix back (the report's owner only gets these).
  for (const back of issue.sentBackHistory ?? []) {
    steps.push({
      label: 'Fix sent back',
      note: `The department's fix was sent back on ${back.on}. Reason: ${back.reason}`,
    })
  }
  if (issue.verification === 'awaiting') steps.push({ label: 'Awaiting admin check' })
  if (status === 'resolved' || status === 'reopened') {
    steps.push({ label: 'Resolved', note: 'After-photo verified by admin' })
  }
  if (status === 'reopened') steps.push({ label: 'Reopened', note: 'Sent to the admin' })
  return steps
}

// email: the logged-in citizen's, for the edit rule (canEditIssue).
export function toReportView(issue, email) {
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
    // For the small street map: the spot, and the pin colour the Map page uses.
    lat: issue.lat,
    lng: issue.lng,
    mapStatus: issue.status,
    status,
    upvotes: issue.votes ?? 0,
    department: issue.department ?? null,
    dateLabel: issue.reportedOn ?? '',
    description: issue.description ?? '',
    updateText: updateText(issue, status),
    history: buildHistory(issue, status),
    // 'ok' | 'locked' (always the owner here): decides the Edit link.
    editState: canEditIssue(issue, email),
  }
}
