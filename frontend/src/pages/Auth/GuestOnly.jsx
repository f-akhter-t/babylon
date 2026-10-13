import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getSession, homePathFor } from '../../services/auth'

// Log-in and sign-up pages. Someone already signed in who opens one goes to
// their home page. The session is read once, when the page opens, so signing
// up on this page (which starts a session) never triggers it.
export default function GuestOnly({ children }) {
  const [session] = useState(getSession)
  if (session) return <Navigate to={homePathFor(session.role)} replace />
  return children
}
