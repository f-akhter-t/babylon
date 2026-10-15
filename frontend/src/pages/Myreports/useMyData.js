import { useEffect, useState } from 'react'
import { getMyReports, getCurrentUser, getEarnPoints, ISSUES_EVENT } from '../../services/api'
import { getSession } from '../../services/auth'
import { toReportView } from './reportView'
 
// Loads this citizen's reports, points and level from services/api.js and
// reloads whenever a report is created or upvoted (ISSUES_EVENT).
export default function useMyData() {
  const email = getSession()?.email
  const [data, setData] = useState({ loading: true, reports: [], user: null, earn: [] })
 
  useEffect(() => {
    let active = true
    const load = () =>
      Promise.all([getMyReports(email), getCurrentUser(email), getEarnPoints()]).then(([issues, user, earn]) => {
        if (active) setData({ loading: false, reports: issues.map((issue) => toReportView(issue, email)), user, earn })
      })
    load()
    window.addEventListener(ISSUES_EVENT, load)
    return () => {
      active = false
      window.removeEventListener(ISSUES_EVENT, load)
    }
  }, [email])
 
  return { ...data, email }
}
 