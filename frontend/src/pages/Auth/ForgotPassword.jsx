import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import AuthShell, { Field, FormError, SubmitButton, authLinkClass } from './AuthShell'
import {
  RESET_CODE_LENGTH,
  RESET_MESSAGES,
  askForResetCode,
  resetPassword,
  validateResetCode,
} from '../../services/passwordApi'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import GuestOnly from './GuestOnly'
import { validateEmail, validatePassword } from './validateNewAccount'
import { useT } from '../../i18n/useLanguage'

// Forgot password, in two steps on one page: the email gets a code, then the
// code and a new password go back together. Opened from either log-in page,
// which says (in the link's state) which one, so the look and the page the
// person returns to after the reset match where they came from.
export default function ForgotPassword() {
  return (
    <GuestOnly>
      <ForgotPasswordPage />
    </GuestOnly>
  )
}

function ForgotPasswordPage() {
  const t = useT()
  useDocumentTitle('Forgot password')
  const navigate = useNavigate()
  const location = useLocation()
  const staff = location.state?.door === 'staff'
  const loginPath = staff ? '/staff/login' : '/login'

  const [step, setStep] = useState('email') // 'email' | 'code'
  const [email, setEmail] = useState(location.state?.email ?? '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [waitLeft, setWaitLeft] = useState(0) // seconds until a new code may be asked for

  useEffect(() => {
    if (waitLeft <= 0) return
    const timer = setTimeout(() => setWaitLeft((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [waitLeft])

  // Asks for a code. True when the server took the request.
  async function sendCode(sentNotice) {
    const problem = validateEmail(email)
    setError(problem ?? '')
    if (problem) return false

    setBusy(true)
    try {
      const { resendAfter } = await askForResetCode(email)
      setWaitLeft(resendAfter)
      setNotice(sentNotice)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function handleEmailSubmit(event) {
    event.preventDefault()
    if (await sendCode(RESET_MESSAGES.codeSent)) setStep('code')
  }

  async function handleResend() {
    if (await sendCode(RESET_MESSAGES.codeResent)) setCode('')
  }

  async function handleResetSubmit(event) {
    event.preventDefault()
    const problem = validateResetCode(code) ?? validatePassword({ password, confirm })
    setError(problem ?? '')
    if (problem) return

    setBusy(true)
    try {
      await resetPassword({ email, code, newPassword: password })
      navigate(loginPath, {
        replace: true,
        state: { email: email.trim(), notice: RESET_MESSAGES.done },
      })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  function changeEmail() {
    setStep('email')
    setCode('')
    setPassword('')
    setConfirm('')
    setNotice('')
    setError('')
    setWaitLeft(0)
  }

  const onCodeStep = step === 'code'

  return (
    <AuthShell
      variant={staff ? 'staff' : 'citizen'}
      title="Forgot password?"
      subtitle={
        onCodeStep
          ? 'Enter the code from the email and choose a new password.'
          : 'Enter your account email and we will send you a code.'
      }
      footer={
        <>
          {t('Remembered it?')}{' '}
          <Link to={loginPath} className={authLinkClass}>
            {t('Log in')}
          </Link>
        </>
      }
    >
      {onCodeStep ? (
        <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
          <p role="status" className="font-body text-sm text-navy">
            {t(notice)}
          </p>
          <p className="font-body text-sm text-slate">
            {t('Email:')} <span className="font-bold break-all text-navy">{email.trim()}</span>{' '}
            <button type="button" onClick={changeEmail} className={authLinkClass}>
              {t('Use a different email')}
            </button>
          </p>

          <Field
            id="code"
            label={t('{count}-digit code', { count: RESET_CODE_LENGTH })}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={RESET_CODE_LENGTH + 6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Field
            id="new-password"
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Field
            id="confirm"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            placeholder="Type it again"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          <FormError message={error} />

          <SubmitButton disabled={!code.trim() || !password || !confirm || busy}>
            {busy ? 'Changing password…' : 'Change password'}
          </SubmitButton>

          <button
            type="button"
            onClick={handleResend}
            disabled={waitLeft > 0 || busy}
            className={clsx(
              authLinkClass,
              'self-center text-navy disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60',
            )}
          >
            {waitLeft > 0 ? t('Send a new code in {seconds}s', { seconds: waitLeft }) : t('Send a new code')}
          </button>
        </form>
      ) : (
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
          <Field
            id="email"
            label={staff ? 'Work email' : 'Email'}
            type="email"
            autoComplete="email"
            placeholder={staff ? 'you@department.gov' : 'you@example.com'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <FormError message={error} />

          <SubmitButton disabled={!email.trim() || busy}>
            {busy ? 'Sending…' : 'Send code'}
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  )
}
