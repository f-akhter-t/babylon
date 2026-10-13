import { Navigate } from 'react-router-dom'
import { getSession, homePathFor } from '../../services/auth'
import { useViewer } from '../Map/useViewer'

// Staff-only pages. Checks the session on every render, so the wrong account
// never sees the page: guests go to the staff sign-in page, everyone else to
// their own home page. `replace` keeps Back from returning here in a loop.
// Client-side only: a real backend must also refuse the data.
export default function RequireRole({ role, children }) {
  useViewer() // re-renders when another tab logs in or out
  const session = getSession()
  if (!session) return <Navigate to="/staff/login" replace />
  if (session.role !== role) return <Navigate to={homePathFor(session.role)} replace />
  return children
}
