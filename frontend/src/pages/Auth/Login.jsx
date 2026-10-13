import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthShell, { DemoHint, Field, FormError, SubmitButton, authLinkClass } from './AuthShell'
import { DEMO_ACCOUNTS, DEMO_PASSWORD, homePathFor, login } from '../../services/auth'
import { useDocumentTitle } from '../IssueDetail/useDocumentTitle'
import GuestOnly from './GuestOnly'

// Citizen log-in. Staff accounts sign in at /staff/login.
export default function Login() {
  return (
    <GuestOnly>
      <LoginPage />
    </GuestOnly>
  )
}

function LoginPage() {
  useDocumentTitle('Log in')
  const navigate = useNavigate()
  const location = useLocation()
  // Filled in when the staff sign-in page sent a citizen account here.
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
      const user = await login({ email, password, door: 'citizen' })
      navigate(homePathFor(user.role))
    } catch (err) {
      setError({ message: err.message, code: err.code })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Log in"
      subtitle="Sign in to report and follow issues in your area."
      footer={
        <>
          New to Babylon?{' '}
          <Link to="/signup" className={authLinkClass}>
            Create an account
          </Link>
        </>
      }
      extra={
        <Link to="/staff/login" className={authLinkClass}>
          Government or admin staff? Sign in here.
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
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
            error?.code === 'staff-account' && (
              <Link to="/staff/login" state={{ email }} className={authLinkClass}>
                Go to the staff sign-in page.
              </Link>
            )
          }
        />

        <SubmitButton disabled={!ready || busy}>{busy ? 'Logging in…' : 'Log in'}</SubmitButton>
      </form>

      <DemoHint
        accounts={DEMO_ACCOUNTS.citizen}
        lines={[`The demo account uses the password ${DEMO_PASSWORD}.`]}
      />
    </AuthShell>
  )
}
