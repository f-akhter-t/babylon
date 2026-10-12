import { useCallback, useEffect, useState } from 'react'
import { getSession } from '../services/auth'
import { getProfile, PROFILE_EVENT } from '../services/api'

// The logged-in citizen's profile. Any component can use it, for example
// the navbar for the name and a Verified badge:
//   const { name, isVerified } = useProfile()
// Updates by itself when the profile changes (this tab or another one).
// Returns empty values for guests, departments and admins.
export function useProfile() {
  const [session, setSession] = useState(getSession)
  const [version, setVersion] = useState(0)
  const email = session?.role === 'citizen' ? session.email : null
  const key = `${email}|${version}`

  // Remember which request the result belongs to, so loading is derived from it.
  const [result, setResult] = useState({ key: null, profile: null, error: false })

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    const refresh = () => {
      setSession(getSession())
      reload()
    }
    window.addEventListener(PROFILE_EVENT, refresh)
    window.addEventListener('storage', refresh) // another tab changed something
    return () => {
      window.removeEventListener(PROFILE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [reload])

  useEffect(() => {
    let ignore = false
    getProfile(email)
      .then((profile) => {
        if (!ignore) setResult({ key, profile, error: false })
      })
      .catch(() => {
        if (!ignore) setResult({ key, profile: null, error: true })
      })
    return () => {
      ignore = true
    }
  }, [email, key])

  // Keep showing the last profile while a refresh loads, so nothing flickers.
  const current = result.key === key
  const profile = email && result.profile?.email === email ? result.profile : null

  return {
    profile,
    name: profile?.name ?? session?.name ?? '',
    isVerified: Boolean(profile?.isVerified),
    loading: Boolean(email) && !current && !profile,
    error: current && result.error,
    reload,
  }
}
