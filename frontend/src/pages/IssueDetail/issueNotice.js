// A one-time message for the Issue detail page, left by the Edit page
// ("Your changes are saved.", or why the edit page could not open).
// It is shown once and then gone, so a refresh or Back does not repeat it.
//   setIssueNotice(id, 'Your changes are saved.')
//   peekIssueNotice(id) -> the message or null; clearIssueNotice(id)

let notice = null

export function setIssueNotice(id, message) {
  notice = { id: String(id), message }
}

export function peekIssueNotice(id) {
  return notice?.id === String(id) ? notice.message : null
}

export function clearIssueNotice(id) {
  if (notice?.id === String(id)) notice = null
}
