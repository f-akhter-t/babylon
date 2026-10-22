import { useCallback } from 'react'
import { getMyReports, getCurrentUser, getEarnPoints } from '../../services/api'
import { getSession } from '../../services/auth'
import { useLiveIssues } from '../../hooks/useLiveIssues'
import { toReportView } from './reportView'

const NONE = []
const reportsOf = (data) => data.reports

// Loads this citizen's reports, points and level from services/api.js, and
// keeps them live: a report filed, changed, moved on or deleted in this tab or
// another one shows up without a reload.
export default function useMyData() {
  const email = getSession()?.email
  const load = useCallback(
    () =>
      Promise.all([getMyReports(email), getCurrentUser(email), getEarnPoints()]).then(([issues, user, earn]) => ({
        reports: issues.map((issue) => toReportView(issue, email)),
        user,
        earn,
      })),
    [email],
  )
  const { data, loading, update } = useLiveIssues(load, { list: reportsOf })

  return {
    loading,
    reports: data?.reports ?? NONE,
    user: data?.user ?? null,
    earn: data?.earn ?? NONE,
    update,
    email,
  }
}
