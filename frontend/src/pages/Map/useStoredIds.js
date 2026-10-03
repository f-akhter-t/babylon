import { useCallback, useEffect, useState } from 'react'

// A list of issue ids saved in this browser (localStorage), so votes and
// follows survive a refresh. The backend will replace this later.
// The key includes the account, so each person has their own list.

function read(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    return Array.isArray(value) ? value : []
  } catch {
    return [] // storage blocked or broken: start empty
  }
}

export function useStoredIds(key) {
  const [stored, setStored] = useState(() => ({ key, ids: read(key) }))

  // A different person logged in: load their list instead.
  if (stored.key !== key) setStored({ key, ids: read(key) })

  useEffect(() => {
    try {
      localStorage.setItem(stored.key, JSON.stringify(stored.ids))
    } catch {
      // Storage is blocked (for example a private window): keep it in memory only.
    }
  }, [stored])

  const toggle = useCallback(
    (id) =>
      setStored((current) => ({
        ...current,
        ids: current.ids.includes(id)
          ? current.ids.filter((x) => x !== id)
          : [...current.ids, id],
      })),
    [],
  )

  return [stored.ids, toggle]
}
