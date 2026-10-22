import { useEffect, useId, useRef, useState } from 'react'
import clsx from 'clsx'
import Button from './Button'
import { useToast } from './toast'
import { changePassword } from '../../services/auth'
import { validatePassword } from '../../pages/Auth/validateNewAccount'

const FIELDS = [
  {
    key: 'current',
    label: 'Current password',
    toggle: 'Show current password',
    autoComplete: 'current-password',
    empty: 'Enter your current password.',
  },
  {
    key: 'next',
    label: 'New password',
    toggle: 'Show new password',
    autoComplete: 'new-password',
    hint: 'At least 6 characters.',
    empty: 'Enter a new password.',
  },
  {
    key: 'confirm',
    label: 'Confirm new password',
    toggle: 'Show confirmed new password',
    autoComplete: 'new-password',
    empty: 'Type your new password again.',
  },
]

const empty = { current: '', next: '', confirm: '' }
const hidden = { current: false, next: false, confirm: false }

const inputClasses =
  'w-full rounded-2xl border bg-white py-3 pr-12 pl-4 font-body text-sm text-navy transition placeholder:text-muted hover:border-forest/50 focus:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 disabled:cursor-not-allowed disabled:bg-white/60 disabled:text-slate'

const iconProps = {
  viewBox: '0 0 24 24',
  className: 'size-5',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

function EyeIcon({ crossed }) {
  return (
    <svg {...iconProps}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
      {crossed && <path d="M4 4l16 16" />}
    </svg>
  )
}

// Field errors for the form as typed, before anything is sent. The length
// and match rules are the sign-up rules, so both pages say the same thing.
function checkForm(values) {
  const errors = {}
  for (const field of FIELDS) {
    if (!values[field.key]) errors[field.key] = field.empty
  }
  if (!errors.next) {
    const rule = validatePassword({ password: values.next, confirm: values.next })
    if (rule) errors.next = rule
    else if (!errors.confirm) {
      const match = validatePassword({ password: values.next, confirm: values.confirm })
      if (match) errors.confirm = match
    }
  }
  return errors
}

// Change the password of the signed-in account, for any role. It has its own
// button and state, so it never marks the page around it as unsaved.
//   <ChangePasswordCard email={session.email} />
export default function ChangePasswordCard({ email }) {
  const id = useId()
  const toast = useToast()
  const [values, setValues] = useState(empty)
  const [shown, setShown] = useState(hidden)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  // Which field to focus once the new errors are on screen: { key, n }
  const [focusRequest, setFocusRequest] = useState(null)
  const inputs = useRef({})

  useEffect(() => {
    if (focusRequest) inputs.current[focusRequest.key]?.focus()
  }, [focusRequest])

  const focusField = (key) => setFocusRequest((r) => ({ key, n: (r?.n ?? 0) + 1 }))

  function update(key, value) {
    setValues((v) => ({ ...v, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
    setFormError('')
  }

  function fail(nextErrors) {
    setErrors(nextErrors)
    const first = FIELDS.find((f) => nextErrors[f.key])
    if (first) focusField(first.key)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (busy) return
    setFormError('')

    const problems = checkForm(values)
    if (Object.keys(problems).length) {
      fail(problems)
      return
    }

    setBusy(true)
    try {
      await changePassword({ email, currentPassword: values.current, newPassword: values.next })
      setValues(empty)
      setShown(hidden)
      setErrors({})
      toast.info('Your password is changed.')
      focusField('current')
    } catch (error) {
      if (error.field === 'current') fail({ current: error.message })
      else if (error.field === 'new') fail({ next: error.message })
      else setFormError(error.message || 'We could not change your password. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Lets password managers save the new password for the right account. */}
      <input
        type="text"
        name="username"
        autoComplete="username"
        value={email}
        readOnly
        aria-hidden="true"
        tabIndex={-1}
        className="sr-only"
      />

      {FIELDS.map((field) => {
        const inputId = `${id}-${field.key}`
        const hintId = field.hint ? `${inputId}-hint` : undefined
        const error = errors[field.key]
        const errorId = error ? `${inputId}-error` : undefined
        const isShown = shown[field.key]

        return (
          <div key={field.key} className="flex flex-col gap-1.5">
            <label htmlFor={inputId} className="font-body text-sm font-semibold text-navy">
              {field.label}
            </label>
            <div className="relative">
              <input
                ref={(el) => {
                  inputs.current[field.key] = el
                }}
                id={inputId}
                name={field.key === 'current' ? 'current-password' : `${field.key}-password`}
                type={isShown ? 'text' : 'password'}
                autoComplete={field.autoComplete}
                autoCapitalize="off"
                spellCheck={false}
                value={values[field.key]}
                onChange={(e) => update(field.key, e.target.value)}
                disabled={busy}
                aria-invalid={Boolean(error)}
                aria-describedby={clsx(hintId, errorId) || undefined}
                className={clsx(inputClasses, error ? 'border-danger' : 'border-navy/15')}
              />
              <button
                type="button"
                aria-label={field.toggle}
                aria-pressed={isShown}
                aria-controls={inputId}
                onClick={() => setShown((s) => ({ ...s, [field.key]: !s[field.key] }))}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-2xl text-slate transition hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
              >
                <EyeIcon crossed={isShown} />
              </button>
            </div>
            {field.hint && (
              <p id={hintId} className="font-body text-xs text-muted">
                {field.hint}
              </p>
            )}
            {error && (
              <p id={errorId} className="font-body text-xs font-semibold text-danger">
                {error}
              </p>
            )}
          </div>
        )
      })}

      {formError && (
        <p
          role="alert"
          className="rounded-tile bg-danger/10 px-4 py-2.5 font-body text-sm font-semibold text-danger"
        >
          {formError}
        </p>
      )}

      <div>
        <Button type="submit" disabled={busy} className="max-md:min-h-11">
          {busy ? 'Changing password…' : 'Change password'}
        </Button>
      </div>
    </form>
  )
}
