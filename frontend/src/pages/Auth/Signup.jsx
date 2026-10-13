import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell, { Field, FormError, SubmitButton, authLinkClass } from './AuthShell'
import { signup, startSetup } from '../../services/auth'
import { useDocumentTitle } from '../IssueDetail/useDocumentTitle'
import { validateNewAccount } from './validateNewAccount'

// Citizen sign-up. Staff accounts are created at /staff/signup.
export default function Signup() {
  useDocumentTitle('Create account')
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const ready = name.trim() && email.trim() && password && confirm

  async function handleSubmit(event) {
    event.preventDefault()
    const problem = validateNewAccount({ email, password, confirm })
    setError(problem ?? '')
    if (problem) return

    setBusy(true)
    try {
      const user = await signup({ name, email, password, role: 'citizen' })
      startSetup(user.email) // first-time profile setup
      navigate('/profile')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Join Babylon to report and follow issues in your area."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className={authLinkClass}>
            Log in
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
          id="name"
          label="Full name"
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Field
          id="confirm"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Type it again"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <FormError message={error} />

        <SubmitButton disabled={!ready || busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </SubmitButton>
      </form>
    </AuthShell>
  )
}
