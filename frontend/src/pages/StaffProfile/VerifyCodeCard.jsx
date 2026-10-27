import { useEffect, useRef, useState } from 'react'
import Button from '../../components/ui/Button'
import ProfileCard from '../Profile/ProfileCard'
import TextField from '../Profile/TextField'
import VerifyBadge from '../Profile/VerifyBadge'
import { useT } from '../../i18n/useLanguage'

// One code to type and check, for the staff profile: the department code and
// the Employee ID. Once it matches, the badge stays and the field is replaced
// by what was verified; there is nothing to change after that.
//   verify(code): resolves when it matches, throws a whole-sentence message
//   done: { label, value } shown once verified
export default function VerifyCodeCard({
  id,
  inputId,
  title,
  intro,
  note,
  badgeLabel,
  prompt,
  label,
  hint,
  verified: verifiedBefore,
  done,
  verify,
  successText,
  onDirtyChange,
  announce,
}) {
  const t = useT()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [focusRequest, setFocusRequest] = useState(null) // { target, n }
  // Shown as verified at once, before the profile reloads with it.
  const [justVerified, setJustVerified] = useState(null) // { value }
  const verified = verifiedBefore || Boolean(justVerified)
  const inputRef = useRef(null)
  const doneRef = useRef(null)

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
      const value = await verify(code)
      setJustVerified({ value })
      setCode('')
      announce(t(successText), { toast: true })
      setFocusRequest({ target: 'done', n: Date.now() })
    } catch (err) {
      setError(err.message || 'We could not check that. Please try again.')
      setFocusRequest({ target: 'input', n: Date.now() })
    } finally {
      setBusy(false)
    }
  }

  return (
    <ProfileCard
      id={id}
      title={title}
      intro={intro}
      badge={
        <VerifyBadge
          status={verified ? 'verified' : 'not-verified'}
          label={verified ? badgeLabel : undefined}
        />
      }
    >
      {verified ? (
        <div
          ref={doneRef}
          tabIndex={-1}
          className="rounded-tile bg-white/70 px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <p className="font-body text-xs text-soft">{t(done.label)}</p>
          <p className="font-heading text-lg font-bold text-navy">
            {t(done.value || justVerified?.value)}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
          {note && <p className="font-body text-sm font-semibold text-navy">{t(note)}</p>}
          {prompt && <p className="font-body text-sm text-navy">{t(prompt)}</p>}
          <div className="flex flex-wrap items-start gap-3">
            <TextField
              ref={inputRef}
              id={inputId}
              label={label}
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
              hint={hint}
              error={error}
              className="min-w-0 flex-1 basis-56"
            />
            <Button type="submit" variant="dark" disabled={busy} className="min-h-11 sm:mt-7">
              {busy ? t('Checking…') : t('Verify')}
            </Button>
          </div>
        </form>
      )}
    </ProfileCard>
  )
}
