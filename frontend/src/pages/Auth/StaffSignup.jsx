import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell, {
  Field,
  FormError,
  RoleRadioGroup,
  SubmitButton,
  authLinkClass,
} from './AuthShell'
import { STAFF_ROLES, profilePathFor, staffSignup } from '../../services/auth'
import { DEPARTMENTS } from '../../utils/departments'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import GuestOnly from './GuestOnly'
import { validateNewAccount } from './validateNewAccount'

// Sign-up for department and admin accounts. Needs the staff access code; the
// server checks it (it is not in this app).
export default function StaffSignup() {
  return (
    <GuestOnly>
      <StaffSignupPage />
    </GuestOnly>
  )
}

function StaffSignupPage() {
  useDocumentTitle('Staff sign up')
  const navigate = useNavigate()
  const [role, setRole] = useState('department')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState(DEPARTMENTS[0])
  const [accessCode, setAccessCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const nameLabel = role === 'department' ? 'Officer name' : 'Full name'
  const ready = name.trim() && email.trim() && accessCode.trim() && password && confirm

  async function handleSubmit(event) {
    event.preventDefault()
    const problem = validateNewAccount({ email, password, confirm })
    setError(problem ?? '')
    if (problem) return

    setBusy(true)
    try {
      const user = await staffSignup({ name, email, password, role, department, accessCode })
      // New staff start with their profile setup.
      navigate(profilePathFor(user.role), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      variant="staff"
      title="Staff sign up"
      subtitle="Create a department or admin account with your staff access code."
      footer={
        <>
          Already have a staff account?{' '}
          <Link to="/staff/login" className={authLinkClass}>
            Sign in
          </Link>
        </>
      }
      extra={
        <Link to="/signup" className={authLinkClass}>
          Not staff? Create a citizen account instead.
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <RoleRadioGroup
          label="Account type"
          options={STAFF_ROLES}
          value={role}
          onChange={setRole}
        />
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
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="you@department.gov"
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
            {DEPARTMENTS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Field>
        )}

        <Field
          id="access-code"
          label="Staff access code"
          autoComplete="off"
          spellCheck={false}
          placeholder="Given to you by your administrator"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
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
          {busy ? 'Creating account…' : 'Create staff account'}
        </SubmitButton>
      </form>

    </AuthShell>
  )
}
