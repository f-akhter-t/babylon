import { useCallback, useMemo, useSyncExternalStore } from 'react'

// A list of issue ids saved in this browser (localStorage), so votes and
// follows survive a refresh. The backend will replace this later.
// The key includes the account, so each person has their own list.
// Live: every page that uses the same key shows the same list, in this tab
// and in other tabs. A change reads the stored list at that moment and
// writes it back at once, so a tab with an older copy can never overwrite
// another tab's votes.

const LOCAL_EVENT = 'babylon:stored-ids'
const memory = new Map() // used when storage is blocked (for example a private window)

function readRaw(key) {
  try {
    return localStorage.getItem(key) ?? '[]'
  } catch {
    return memory.get(key) ?? '[]'
  }
}

function parse(raw) {
  try {
    const value = JSON.parse(raw)
    return Array.isArray(value) ? value : []
  } catch {
    return [] // broken value: start empty
  }
}

function write(key, ids) {
  const raw = JSON.stringify(ids)
  try {
    localStorage.setItem(key, raw)
  } catch {
    memory.set(key, raw) // storage blocked: keep it in memory only
  }
  // Other tabs hear the storage event; this tab needs its own signal.
  window.dispatchEvent(new CustomEvent(LOCAL_EVENT, { detail: key }))
}

export function useStoredIds(key) {
  const subscribeKey = useCallback(
    (onChange) => {
      const onStorage = (e) => {
        if (e.key === key) onChange()
      }
      const onLocal = (e) => {
        if (e.detail === key) onChange()
      }
      window.addEventListener('storage', onStorage)
      window.addEventListener(LOCAL_EVENT, onLocal)
      return () => {
        window.removeEventListener('storage', onStorage)
        window.removeEventListener(LOCAL_EVENT, onLocal)
      }
    },
    [key],
  )
  // The raw string is the snapshot: it stays the same until the list changes.
  const raw = useSyncExternalStore(subscribeKey, () => readRaw(key))
  const ids = useMemo(() => parse(raw), [raw])

  const toggle = useCallback(
    (id) => {
      const current = parse(readRaw(key)) // what is stored now, not what this page last saw
      write(key, current.includes(id) ? current.filter((x) => x !== id) : [...current, id])
    },
    [key],
  )

  return [ids, toggle]
}
