// An issue can be put on a map only when it has both coordinates. Reports filed
// through the app always do; rows from the department and admin seeds do not.
export function hasPosition(issue) {
  return Number.isFinite(issue?.lat) && Number.isFinite(issue?.lng)
}
