import { useCallback, useState } from 'react'
import { getIssueById } from '../../services/api'
import { useLiveIssues } from '../../hooks/useLiveIssues'

// Loads one issue by its id (the number in the address bar), and keeps it
// live: another tab's change shows here without a reload.
//   const { issue, loading, error, update, deleted } = useIssue(id)
// issue is null when that id does not exist. deleted: it existed while this
// page was open and has now gone (deleted in another tab).
export function useIssue(id) {
  // Wrapped, so "no such issue" (null) is data, not "still loading".
  const load = useCallback(() => getIssueById(id).then((issue) => ({ issue })), [id])
  const { data, loading, error, update } = useLiveIssues(load)
  const issue = data?.issue ?? null
  // Remember that this id was on screen, so its disappearing means "deleted"
  // (a wrong id never was).
  const [seenId, setSeenId] = useState(null)
  if (issue && seenId !== id) setSeenId(id)
  return {
    issue,
    loading,
    error: Boolean(error),
    update,
    deleted: seenId === id && !issue && !loading,
  }
}
