import { useCallback, useEffect, useState } from 'react'
import { getMyReports, getCurrentUser, getEarnPoints, ISSUES_EVENT } from '../../services/api'
import { getSession } from '../../services/auth'
import { toReportView } from './reportView'

// Loads this citizen's reports, points and level from services/api.js and
// reloads whenever a report is created or upvoted (ISSUES_EVENT).
export default function useMyData() {
  const email = getSession()?.email
  const [data, setData] = useState({ loading: true, reports: [], user: null, earn: [] })

  const load = useCallback(async () => {
    try {
      const [issues, user, earn] = await Promise.all([
        getMyReports(email),
        getCurrentUser(email),
        getEarnPoints(),
      ])
      console.log('[MyReports] email:', email, '| reports found:', issues.length, issues)
      setData({ loading: false, reports: issues.map(toReportView), user, earn })
    } catch (err) {
      // without this, a crash leaves the page on "Loading" with no clue why
      console.error('[MyReports] could not load:', err)
      setData((d) => ({ ...d, loading: false }))
    }
  }, [email])

  useEffect(() => {
    load()
    window.addEventListener(ISSUES_EVENT, load)
    return () => window.removeEventListener(ISSUES_EVENT, load)
  }, [load])

  return { ...data, email }
}