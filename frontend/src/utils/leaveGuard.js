// One place to ask "leave without saving?" before the app moves away from a
// page. A page with unsaved changes registers a check; anything that navigates
// in code (for example a Log out button) calls confirmLeave() first.
//   const release = setLeaveGuard(() => window.confirm('Leave anyway?'))
//   if (!confirmLeave()) return

let guard = null

// Returns a function that removes this check again.
export function setLeaveGuard(check) {
  guard = check
  return () => {
    if (guard === check) guard = null
  }
}

// true when it is fine to leave: nothing is registered, or the person agreed.
export function confirmLeave() {
  return guard ? guard() : true
}
