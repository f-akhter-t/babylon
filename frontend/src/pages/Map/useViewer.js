import { useEffect, useState } from 'react'
import { getSession } from '../../services/auth'

// Who is looking at the page. Used by the Map page and the Issue detail page:
//   const viewer = useViewer()
//   viewer.isGuest  -> nobody is logged in
//   viewer.canAct   -> a citizen, who may upvote, follow and report
//   viewer.role     -> 'guest' | 'citizen' | 'department' | 'admin'
//   viewer.storageKey('voted') -> a browser storage key for this account
export function useViewer() {
  const [session, setSession] = useState(getSession)

  // The "storage" event fires when another tab logs in or out.
  useEffect(() => {
    const onStorage = () => setSession(getSession())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const role = session?.role ?? 'guest'

  return {
    session,
    role,
    isGuest: !session,
    canAct: role === 'citizen',
    storageKey: (name) => `babylon:${name}:${session?.email ?? 'guest'}`,
  }
}
