import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthShell, { DemoHint, Field, FormError, SubmitButton, authLinkClass } from './AuthShell'
import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  homePathFor,
  login,
} from '../../services/auth'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import GuestOnly from './GuestOnly'
import { useT } from '../../i18n/useLanguage'

// Sign-in for department and admin accounts. The role comes from the account.
export default function StaffLogin() {
  return (
    <GuestOnly>
      <StaffLoginPage />
    </GuestOnly>
  )
}

function StaffLoginPage() {
  const t = useT()
  useDocumentTitle('Staff sign in')
  const navigate = useNavigate()
  const location = useLocation()
  // Filled in when the citizen log-in page sent a staff account here.
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
          {t('Need a staff account?')}{' '}
          <Link to="/staff/signup" className={authLinkClass}>
            {t('Create a staff account')}
          </Link>
        </>
      }
      extra={
        <Link to="/login" className={authLinkClass}>
          {t('Not staff? Go to the citizen log-in page.')}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {notice && (
          <p role="status" className="font-body text-sm font-bold text-forest">
            {t(notice)}
          </p>
        )}
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
        <Link
          to="/forgot-password"
          state={{ email, door: 'staff' }}
          className={`${authLinkClass} self-start`}
        >
          {t('Forgot password?')}
        </Link>

        <FormError
          message={error?.message}
          action={
            error?.code === 'citizen-account' && (
              <Link to="/login" state={{ email }} className={authLinkClass}>
                {t('Go to the citizen log-in page.')}
              </Link>
            )
          }
        />

        <SubmitButton disabled={!ready || busy}>{busy ? 'Signing in…' : 'Sign in'}</SubmitButton>
      </form>

      <DemoHint
        accounts={DEMO_ACCOUNTS.staff}
        lines={[
          t('Both demo accounts use the password {password}.', { password: DEMO_PASSWORD }),
          'To create a staff account, ask your administrator for the staff access code.',
        ]}
      />
    </AuthShell>
  )
}
