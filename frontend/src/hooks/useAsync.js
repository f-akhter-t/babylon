import { useCallback, useEffect, useState } from 'react'

// Loads data for a page and keeps track of loading and errors.
//   const { data, error, loading, retry, reload } = useAsync(load)
// `load` must be stable (useCallback). retry() shows loading again and tries
// once more; reload() refreshes quietly and keeps the current data on screen.
export function useAsync(load) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let ignore = false
    load().then(
      (data) => {
        if (!ignore) setState({ data, error: null, loading: false })
      },
      (error) => {
        if (!ignore) setState({ data: null, error, loading: false })
      },
    )
    return () => {
      ignore = true
    }
  }, [load, attempt])

  const retry = useCallback(() => {
    setState({ data: null, error: null, loading: true })
    setAttempt((n) => n + 1)
  }, [])
  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  return { ...state, retry, reload }
}
