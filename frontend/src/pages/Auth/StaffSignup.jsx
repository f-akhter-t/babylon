import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell, {
  DemoHint,
  Field,
  FormError,
  RoleRadioGroup,
  SubmitButton,
  authLinkClass,
} from './AuthShell'
import { DEMO_STAFF_CODE, STAFF_ROLES, homePathFor, signup } from '../../services/auth'
import { departments } from '../../mock/departments'
import { useDocumentTitle } from '../IssueDetail/useDocumentTitle'
import GuestOnly from './GuestOnly'
import { validateNewAccount } from './validateNewAccount'

// Sign-up for department and admin accounts. Needs the staff access code,
// which signup() checks.
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
  const [department, setDepartment] = useState(departments[0].name)
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
      const user = await signup({ name, email, password, role, department, accessCode })
      navigate(homePathFor(user.role))
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
            {departments.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
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

      <DemoHint lines={[`For this demo, the staff access code is ${DEMO_STAFF_CODE}.`]} />
    </AuthShell>
  )
}
