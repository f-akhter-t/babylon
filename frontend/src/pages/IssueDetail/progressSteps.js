// Turns one issue into the three Progress steps. Only reads the issue's fields.
//   step: { number, label, done, current, lines: [{ text, muted }] }
// muted lines are things that have not happened yet (grey text).

const STEP_FOR_STATUS = { open: 1, 'in-progress': 2, resolved: 3 }

const line = (text, muted = false) => ({ text, muted })

function openLines(issue) {
  return [line(`Reported ${issue.reportedOn}`), line(`Sent to ${issue.department} ${issue.sentOn}`)]
}

function inProgressLines(issue) {
  if (!issue.startedOn) {
    // A resolved issue without a start date is simply done: no grey text.
    return issue.status === 'open' ? [line('Not started yet', true)] : []
  }
  const lines = [line(`Started ${issue.startedOn}`)]
  if (issue.departmentNote) lines.push(line(issue.departmentNote))
  // Only the citizen who filed the report gets sentBackHistory (services/api.js).
  for (const back of issue.sentBackHistory ?? []) {
    lines.push(line(`The department's fix was sent back on ${back.on}. Reason: ${back.reason}`))
  }
  if (issue.verification === 'awaiting') {
    lines.push(line(`Submitted ${issue.submittedOn}, waiting for the admin check`))
  }
  return lines
}

function resolvedLines(issue) {
  if (issue.status !== 'resolved') {
    return [line('Needs an after-photo and an admin check', true)]
  }
  // A reopened issue the admin closed again without a new fix (no after-photo).
  if (issue.reopenedFrom && !issue.afterImg) return [line(`The admin confirmed the fix from ${issue.reopenedFrom}`)]
  const days = issue.fixedInDays === 1 ? '1 day' : `${issue.fixedInDays} days`
  return [line(`Fixed in ${days}`)]
}

export function buildProgress(issue) {
  const current = STEP_FOR_STATUS[issue.status]
  const resolved = issue.status === 'resolved'

  const steps = [
    { label: 'Open', lines: openLines(issue) },
    { label: 'In progress', lines: inProgressLines(issue) },
    { label: 'Resolved', lines: resolvedLines(issue) },
  ].map((step, index) => {
    const number = index + 1
    return {
      ...step,
      number,
      // Once resolved, the last step is finished too.
      done: number < current || resolved,
      current: number === current,
    }
  })

  // Still reopened while the admin checks it again (its priority stays 'reopened').
  const reopened =
    issue.verification === 'reopened' || issue.priority === 'reopened'
      ? `Reopened. First marked resolved ${issue.reopenedFrom}`
      : null

  return { current, steps, reopened }
}
