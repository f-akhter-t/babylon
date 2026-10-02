import { useEffect, useState } from 'react'
import { getIssues } from '../../services/api'

// Loads the filtered list for the sidebar and map, plus every issue
// (used to spot duplicates when someone drops a pin).
export function useIssues({ category, status, search }) {
  const [issues, setIssues] = useState([])
  const [allIssues, setAllIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0) // bumping this loads again

  useEffect(() => {
    let ignore = false
    getIssues({ category, status, search })
      .then((list) => {
        if (!ignore) {
          setIssues(list)
          setError(false)
        }
      })
      .catch(() => {
        if (!ignore) setError(true)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [category, status, search, attempt])

  useEffect(() => {
    let ignore = false
    getIssues()
      .then((list) => {
        if (!ignore) setAllIssues(list)
      })
      .catch(() => {}) // duplicate check is a bonus; the page still works without it
    return () => {
      ignore = true
    }
  }, [attempt])

  const retry = () => {
    setError(false)
    setLoading(true)
    setAttempt((n) => n + 1)
  }

  return { issues, allIssues, loading, error, retry }
}
