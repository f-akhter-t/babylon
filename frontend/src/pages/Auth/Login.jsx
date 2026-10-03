import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import AuthShell, { Field, RoleTabs } from './AuthShell'
import { DEMO_LOGIN, homePathFor, login } from '../../services/auth'

export default function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState('citizen')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const ready = email.trim() && password

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = await login({ email, password, role })
      navigate(homePathFor(user.role))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Log in"
      subtitle="Choose your account type, then sign in."
      footer={
        <>
          New to Babylon?{' '}
          <Link to="/signup" className="font-bold underline">
            Create an account
          </Link>
        </>
      }
    >
      <RoleTabs value={role} onChange={setRole} />

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
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

        {error && <p className="font-body text-sm font-bold text-amber-dark">{error}</p>}

        <button
          type="submit"
          disabled={!ready || busy}
          className={clsx(
            'rounded-full bg-navy px-6 py-3.5 font-body text-base font-bold text-mint transition-opacity',
            !ready || busy ? 'cursor-not-allowed opacity-40' : 'hover:opacity-90',
          )}
        >
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-5 rounded-tile bg-white px-4 py-3 font-body text-sm text-muted">
        Demo account: <span className="font-bold text-navy">{DEMO_LOGIN[role]}</span> with
        password <span className="font-bold text-navy">password123</span>
      </p>
    </AuthShell>
  )
}