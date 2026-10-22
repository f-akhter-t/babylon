import { useCallback } from 'react'
import { getIssues } from '../../services/api'
import { useLiveIssues } from '../../hooks/useLiveIssues'

const NONE = []
const every = (list) => list

// The filtered list for the sidebar and map, plus every issue (used to spot
// duplicates when someone drops a pin, and to notice a report that was
// deleted while its popup is open). Both stay live: another tab's new,
// changed or deleted report shows up without a reload.
export function useIssues({ category, status, search }) {
  const loadFiltered = useCallback(() => getIssues({ category, status, search }), [category, status, search])
  const loadAll = useCallback(() => getIssues(), [])
  const filtered = useLiveIssues(loadFiltered, { list: every })
  const all = useLiveIssues(loadAll, { list: every })

  const retry = () => {
    filtered.retry()
    all.retry()
  }

  return {
    issues: filtered.data ?? NONE,
    allIssues: all.data ?? NONE, // the duplicate check is a bonus; the page works without it
    loading: filtered.loading,
    error: Boolean(filtered.error),
    update: filtered.update,
    allUpdate: all.update,
    retry,
  }
}
