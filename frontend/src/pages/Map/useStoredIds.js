import { useCallback, useEffect, useState } from 'react'

// A list of issue ids saved in this browser (localStorage), so votes and
// follows survive a refresh. The backend will replace this later.

function read(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    return Array.isArray(value) ? value : []
  } catch {
    return [] // storage blocked or broken: start empty
  }
}

export function useStoredIds(key) {
  const [ids, setIds] = useState(() => read(key))

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(ids))
    } catch {
      // Storage is blocked (for example a private window): keep it in memory only.
    }
  }, [key, ids])

  const toggle = useCallback(
    (id) => setIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id])),
    [],
  )

  return [ids, toggle]
}
