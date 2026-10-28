import { useEffect, useState } from 'react'
import { getAdminCounts, getDepartmentSummary, ISSUES_EVENT } from '../services/api'
import { usePendingIdentityCount } from './usePendingIdentityCount'

async function countsFor(variant, department) {
  if (variant === 'admin') return getAdminCounts() // { queue, reopened }
  if (!department) return {}
  // The server knows the department from the token.
  const { inProgress, awaiting } = await getDepartmentSummary()
  return { inProgress, awaiting }
}

// The numbers for the staff sidebar badges, keyed like ADMIN_NAV's `badge`.
// Updates by itself when issues change (this tab or another one).
export function useAdminCounts(variant, department) {
  const [counts, setCounts] = useState({})
  const identity = usePendingIdentityCount(variant === 'admin')

  useEffect(() => {
    let ignore = false
    const refresh = () => {
      countsFor(variant, department)
        .then((next) => {
          if (!ignore) setCounts(next)
        })
        .catch(() => {
          // a failed refresh keeps the numbers already shown
        })
    }
    refresh()
    window.addEventListener(ISSUES_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      ignore = true
      window.removeEventListener(ISSUES_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [variant, department])

  return variant === 'admin' ? { ...counts, identity } : counts
}
