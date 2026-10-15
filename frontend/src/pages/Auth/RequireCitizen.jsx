import { Navigate, useLocation } from 'react-router-dom'
import { getSession, homePathFor } from '../../services/auth'
import { useViewer } from '../Map/useViewer'

// Citizen-only pages. Staff go to their own home page.
//   guests="login": guests go to /login, which brings them back here afterwards
//   guests="allow": guests see the page (it shows its own logged-out state)
// Checks the session on every render, like RequireRole. `replace` keeps Back
// from returning here in a loop. Client-side only: a real backend must also
// refuse the data.
export default function RequireCitizen({ guests = 'login', children }) {
  useViewer() // re-renders when another tab logs in or out
  const location = useLocation()
  const session = getSession()
  if (!session) {
    if (guests === 'allow') return children
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  if (session.role !== 'citizen') return <Navigate to={homePathFor(session.role)} replace />
  return children
}
