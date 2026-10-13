import { useEffect, useState } from 'react'
import {
  getAdminCounts,
  getCompletedDepartmentIssues,
  getDepartmentIssues,
  ISSUES_EVENT,
} from '../services/api'
import { issuesFor } from '../pages/DepartmentPanel/departmentFilters'
import { usePendingIdentityCount } from './usePendingIdentityCount'

async function countsFor(variant, department) {
  if (variant === 'admin') return getAdminCounts() // { queue, reopened }
  if (!department) return {}
  // Only the signed-in department's issues, counted the same way as its filters.
  const [assigned, completed] = await Promise.all([
    getDepartmentIssues(department),
    getCompletedDepartmentIssues(department),
  ])
  return {
    inProgress: issuesFor('in-progress', assigned, completed).length,
    awaiting: issuesFor('awaiting', assigned, completed).length,
  }
}

// The numbers for the staff sidebar badges, keyed like ADMIN_NAV's `badge`.
// Updates by itself when issues change (this tab or another one).
export function useAdminCounts(variant, department) {
  const [counts, setCounts] = useState({})
  const identity = usePendingIdentityCount()

  useEffect(() => {
    let ignore = false
    const refresh = () => {
      countsFor(variant, department).then((next) => {
        if (!ignore) setCounts(next)
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
