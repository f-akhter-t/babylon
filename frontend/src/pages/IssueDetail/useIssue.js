import { useEffect, useState } from 'react'
import { getIssueById } from '../../services/api'

// Loads one issue by its id (the number in the address bar).
//   const { issue, loading, error } = useIssue(id)
// issue is null when that id does not exist.
export function useIssue(id) {
  // Remember which id the result belongs to, so a new id shows "loading" again.
  const [result, setResult] = useState({ id: null, issue: null, error: false })

  useEffect(() => {
    let ignore = false
    getIssueById(id)
      .then((issue) => {
        if (!ignore) setResult({ id, issue, error: false })
      })
      .catch(() => {
        if (!ignore) setResult({ id, issue: null, error: true })
      })
    return () => {
      ignore = true
    }
  }, [id])

  const loading = result.id !== id
  return {
    issue: loading ? null : result.issue,
    loading,
    error: !loading && result.error,
  }
}
