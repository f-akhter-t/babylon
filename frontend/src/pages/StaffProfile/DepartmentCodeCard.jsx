import { useEffect, useRef, useState } from 'react'
import Button from '../../components/ui/Button'
import ProfileCard from '../Profile/ProfileCard'
import TextField from '../Profile/TextField'
import VerifyBadge from '../Profile/VerifyBadge'
import { verifyDepartmentCode } from '../../services/api'

// Department accounts only: the code that proves which department they work
// for. Once it matches, the badge stays; there is nothing to change after that.
export default function DepartmentCodeCard({ profile, onDirtyChange, announce }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [focusRequest, setFocusRequest] = useState(null) // { target, n }
  const inputRef = useRef(null)
  const doneRef = useRef(null)
  // Shown as verified at once, before the profile reloads with it.
  const [justVerified, setJustVerified] = useState(false)
  const verified = profile.departmentVerified || justVerified

  useEffect(() => {
    onDirtyChange(!verified && code.trim() !== '')
  }, [verified, code, onDirtyChange])

  useEffect(() => {
    if (focusRequest?.target === 'input') inputRef.current?.focus()
    if (focusRequest?.target === 'done') doneRef.current?.focus()
  }, [focusRequest])

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await verifyDepartmentCode(profile.email, code)
      setJustVerified(true)
      setCode('')
      announce('Your department is verified.', { toast: true })
      setFocusRequest({ target: 'done', n: Date.now() })
    } catch (err) {
      setError(err.message || 'We could not check that code. Please try again.')
      setFocusRequest({ target: 'input', n: Date.now() })
    } finally {
      setBusy(false)
    }
  }

  return (
    <ProfileCard
      id="staff-department"
      title="Department"
      intro="Enter your department's code once, so citizens know you really work there."
      badge={
        <VerifyBadge
          status={verified ? 'verified' : 'not-verified'}
          label={verified ? 'Department verified' : undefined}
        />
      }
    >
      {verified ? (
        <div
          ref={doneRef}
          tabIndex={-1}
          className="rounded-tile bg-white/70 px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
        >
          <p className="font-body text-xs text-slate">You work for</p>
          <p className="font-heading text-lg font-bold text-navy">{profile.department}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          <p className="font-body text-sm text-navy">
            {`You signed up for ${profile.department}.`}
          </p>
          <div className="flex flex-wrap items-start gap-3">
            <TextField
              ref={inputRef}
              id="staff-department-code"
              label="Department code"
              value={code}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={20}
              onChange={(e) => {
                setCode(e.target.value)
                setError('')
              }}
              disabled={busy}
              hint="Ask your department head for the code."
              error={error}
              className="min-w-0 flex-1 basis-56"
            />
            <Button type="submit" variant="dark" disabled={busy} className="min-h-11 sm:mt-7">
              {busy ? 'Checking…' : 'Verify'}
            </Button>
          </div>
        </form>
      )}
    </ProfileCard>
  )
}
