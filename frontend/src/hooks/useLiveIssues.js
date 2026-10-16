import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { getSnapshot, subscribe } from './liveIssues'

const NO_CHANGES = { added: [], changed: [], removed: [] }

// What changed between two loads of a list, by id.
function compare(before, after, idOf) {
  if (!Array.isArray(before) || !Array.isArray(after)) return NO_CHANGES
  const old = new Map(before.map((item) => [String(idOf(item)), JSON.stringify(item)]))
  const now = new Set()
  const added = []
  const changed = []
  for (const item of after) {
    const id = String(idOf(item))
    now.add(id)
    if (!old.has(id)) added.push(id)
    else if (old.get(id) !== JSON.stringify(item)) changed.push(id)
  }
  const removed = [...old.keys()].filter((id) => !now.has(id))
  return { added, changed, removed }
}

// Loads data and keeps it live: it loads again, quietly, whenever reports
// change in this tab or another one (see liveIssues.js), and keeps the
// current data on screen meanwhile.
//   const { data, loading, error, retry, update } = useLiveIssues(load, { list })
//   load: a stable function (useCallback). A new load (new filters) is a fresh
//         start: loading again, and no "changes".
//   list: (data) => the array to compare, for update.added/changed/removed.
//   update: { version, remote, animate, added, changed, removed } for the
//           last load; remote is false for this tab's own actions, animate is
//           false when the change arrived while the tab was hidden.
export function useLiveIssues(load, { list, idOf = (item) => item.id } = {}) {
  const live = useSyncExternalStore(subscribe, getSnapshot)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ load: null, data: null, error: null, update: null })

  useEffect(() => {
    let ignore = false
    load().then(
      (data) => {
        if (ignore) return
        setState((prev) => {
          const sameQuery = prev.load === load && prev.data !== null
          const changes = sameQuery && list ? compare(list(prev.data), list(data), idOf) : NO_CHANGES
          return {
            load,
            data,
            error: null,
            update: sameQuery ? { ...live, ...changes } : null,
          }
        })
      },
      (error) => {
        if (ignore) return
        // A quiet reload that fails keeps what is on screen; a first load shows the error.
        setState((prev) =>
          prev.load === load && prev.data !== null ? prev : { load, data: null, error, update: null },
        )
      },
    )
    return () => {
      ignore = true
    }
    // list and idOf are read only to compare; a new function each render is fine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, live, attempt])

  const retry = useCallback(() => {
    setState((prev) => ({ ...prev, error: null, data: null, load: null }))
    setAttempt((n) => n + 1)
  }, [])

  const current = state.load === load
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    loading: !current || (state.data === null && state.error === null),
    retry,
    update: current ? state.update : null,
  }
}
