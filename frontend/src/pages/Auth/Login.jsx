import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthShell, { DemoHint, Field, FormError, SubmitButton, authLinkClass } from './AuthShell'
import { DEMO_ACCOUNTS, DEMO_PASSWORD, homePathFor, login } from '../../services/auth'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import GuestOnly from './GuestOnly'

// Citizen log-in. Staff accounts sign in at /staff/login.
export default function Login() {
  return (
    <GuestOnly>
      <LoginPage />
    </GuestOnly>
  )
}

// Where to go after logging in. RequireCitizen sends guests here from /report
// (keeping ?lat=…&lng=… from the Map). Only /report itself, with or without a
// query string, is accepted, so this can never send someone to another site.
function returnPathFrom(state) {
  const from = state?.from
  return typeof from === 'string' && /^\/report(\?[^#]*)?$/.test(from) ? from : null
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
  // Set when the password was just reset, so the person knows to log in with it.
  const [notice, setNotice] = useState(location.state?.notice ?? '')

  const ready = email.trim() && password

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setNotice('')
    setBusy(true)
    try {
      const user = await login({ email, password, door: 'citizen' })
      const back = user.role === 'citizen' ? returnPathFrom(location.state) : null
      if (back) navigate(back, { replace: true })
      else navigate(homePathFor(user.role))
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
        {notice && (
          <p role="status" className="font-body text-sm font-bold text-forest">
            {notice}
          </p>
        )}
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
        <Link
          to="/forgot-password"
          state={{ email, door: 'citizen' }}
          className={`${authLinkClass} self-start`}
        >
          Forgot password?
        </Link>

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
