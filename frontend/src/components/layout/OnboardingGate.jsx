import { Navigate, useLocation } from 'react-router-dom'
import { useViewer } from '../../pages/Map/useViewer'
import { getSession, isOnboarded, profilePathFor } from '../../services/auth'

// One guard for every route. A staff account that has not finished its
// profile can open only its own profile page; any other address (public
// pages, citizen pages, the sign-in pages, a page that does not exist) goes
// there instead. Log out is a button, not a page, so it always works.
// The flag is read from the stored account on every render (the session
// never holds it), and the session is read fresh too: this sits above every
// page and never remounts, so a sign-in in this tab must count at once.
// useViewer re-renders it when another tab changes storage.
// `replace` keeps Back from returning to the blocked page in a loop.
// Client-side only: a real backend must also refuse the data.
export default function OnboardingGate({ children }) {
  useViewer() // re-renders when another tab signs in, out or finishes setup
  const { pathname } = useLocation() // and on every page change in this tab
  const session = getSession()

  if (session && !isOnboarded(session.email)) {
    const profilePath = profilePathFor(session.role)
    const here = pathname.replace(/\/+$/, '') || '/'
    if (here !== profilePath) {
      return <Navigate to={profilePath} replace state={{ gated: true }} />
    }
  }

  return children
}
