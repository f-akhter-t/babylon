import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthShell, { DemoHint, Field, FormError, SubmitButton, authLinkClass } from './AuthShell'
import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  DEMO_STAFF_CODE,
  homePathFor,
  login,
} from '../../services/auth'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import GuestOnly from './GuestOnly'

// Sign-in for department and admin accounts. The role comes from the account.
export default function StaffLogin() {
  return (
    <GuestOnly>
      <StaffLoginPage />
    </GuestOnly>
  )
}

function StaffLoginPage() {
  useDocumentTitle('Staff sign in')
  const navigate = useNavigate()
  const location = useLocation()
  // Filled in when the citizen log-in page sent a staff account here.
  const [email, setEmail] = useState(location.state?.email ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null) // { message, code }
  const [busy, setBusy] = useState(false)

  const ready = email.trim() && password

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const user = await login({ email, password, door: 'staff' })
      navigate(homePathFor(user.role))
    } catch (err) {
      setError({ message: err.message, code: err.code })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      variant="staff"
      title="Staff sign in"
      subtitle="For government departments and Babylon administrators."
      footer={
        <>
          Need a staff account?{' '}
          <Link to="/staff/signup" className={authLinkClass}>
            Create a staff account
          </Link>
        </>
      }
      extra={
        <Link to="/login" className={authLinkClass}>
          Not staff? Go to the citizen log-in page.
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field
          id="email"
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="you@department.gov"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <FormError
          message={error?.message}
          action={
            error?.code === 'citizen-account' && (
              <Link to="/login" state={{ email }} className={authLinkClass}>
                Go to the citizen log-in page.
              </Link>
            )
          }
        />

        <SubmitButton disabled={!ready || busy}>{busy ? 'Signing in…' : 'Sign in'}</SubmitButton>
      </form>

      <DemoHint
        accounts={DEMO_ACCOUNTS.staff}
        lines={[
          `Both demo accounts use the password ${DEMO_PASSWORD}.`,
          `To create a staff account, use the demo access code ${DEMO_STAFF_CODE}.`,
        ]}
      />
    </AuthShell>
  )
}
