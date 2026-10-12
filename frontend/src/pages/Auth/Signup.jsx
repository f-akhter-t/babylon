import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import AuthShell, { Field, RoleTabs } from './AuthShell'
import { homePathFor, signup, startSetup } from '../../services/auth'
import { departments } from '../../mock/departments'

export default function Signup() {
  const navigate = useNavigate()
  const [role, setRole] = useState('citizen')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState(departments[0].name)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const nameLabel = role === 'department' ? 'Officer name' : 'Full name'
  const ready = name.trim() && email.trim() && password && confirm

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('The two passwords do not match.')
      return
    }

    setBusy(true)
    try {
      const user = await signup({ name, email, password, role, department })
      if (user.role === 'citizen') {
        startSetup(user.email) // first-time profile setup
        navigate('/profile')
      } else {
        navigate(homePathFor(user.role))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Choose your account type, then fill in your details."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-bold underline">
            Log in
          </Link>
        </>
      }
    >
      <RoleTabs value={role} onChange={setRole} />

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <Field
          id="name"
          label={nameLabel}
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

        {role === 'department' && (
          <Field
            id="department"
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            {departments.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </Field>
        )}

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

        {error && <p className="font-body text-sm font-bold text-amber-dark">{error}</p>}

        <button
          type="submit"
          disabled={!ready || busy}
          className={clsx(
            'rounded-full bg-navy px-6 py-3.5 font-body text-base font-bold text-mint transition-opacity',
            !ready || busy ? 'cursor-not-allowed opacity-40' : 'hover:opacity-90',
          )}
        >
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}