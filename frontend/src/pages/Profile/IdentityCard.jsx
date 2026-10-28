import { useEffect, useRef, useState } from 'react'
import Button from '../../components/ui/Button'
import ProfileCard from './ProfileCard'
import TextField from './TextField'
import FormNotice from './FormNotice'
import VerifyBadge from './VerifyBadge'
import IdentityTimeline from './IdentityTimeline'
import PhotoDropzone from './PhotoDropzone'
import { submitIdentity } from '../../services/api'
import { checkIdPhoto, checkNid, normalizeNid } from '../../utils/profileRules'
import { canReadImage, UNREADABLE_PHOTO } from '../../utils/idPhoto'
import { useFormat } from '../../i18n/useFormat'
import { useT } from '../../i18n/useLanguage'

// The full NID number lives only in this component's state and is never
// stored; the profile keeps its last 4 digits. The card photo is kept by
// submitIdentity only until an admin reviews it, then deleted.
export default function IdentityCard({ profile, onDirtyChange, announce }) {
  const t = useT()
  const { date } = useFormat()
  const [sent, setSent] = useState(null) // identity returned by the last submit
  // Until the profile reloads, show what was just sent instead of the old status.
  const identity =
    sent &&
    profile.identity.status !== 'pending' &&
    profile.identity.submittedAt !== sent.submittedAt
      ? sent
      : profile.identity
  const [resubmitting, setResubmitting] = useState(false)
  const [nid, setNid] = useState('')
  const [nidTouched, setNidTouched] = useState(false)
  const [photo, setPhoto] = useState(null) // { file, url }
  const [photoError, setPhotoError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState(null) // { tone, text }
  const [focusRequest, setFocusRequest] = useState(0)
  const statusRef = useRef(null)
  const pickRef = useRef(0) // the latest photo choice wins if two are checked at once

  const formOpen =
    identity.status === 'not-submitted' || (identity.status === 'rejected' && resubmitting)
  const nidError = checkNid(nid)
  const canSubmit = formOpen && !nidError && photo && !submitting
  const nidDigits = normalizeNid(nid).length

  const dirty = formOpen && (nid.trim() !== '' || Boolean(photo))
  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

  // free the preview when the photo changes or the page closes
  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.url)
    }
  }, [photo])

  // After sending, move focus to the new status so keyboard users land on it.
  useEffect(() => {
    if (focusRequest) statusRef.current?.focus()
  }, [focusRequest])

  async function handleFile(file) {
    if (!file) return
    const problem = checkIdPhoto(file)
    if (problem) {
      setPhotoError(problem)
      return
    }
    // A HEIC photo or a renamed file can pass the type check but not open.
    const pick = ++pickRef.current
    const readable = await canReadImage(file)
    if (pick !== pickRef.current) return
    if (!readable) {
      setPhotoError(UNREADABLE_PHOTO)
      return
    }
    setPhotoError('')
    setNotice(null)
    setPhoto({ file, url: URL.createObjectURL(file) })
  }

  function clearForm() {
    setNid('')
    setNidTouched(false)
    setPhoto(null)
    setPhotoError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setNotice(null)
    try {
      const next = await submitIdentity(profile.email, { nid, photo: photo.file })
      setSent(next.identity)
      clearForm()
      setResubmitting(false)
      const text = 'Thank you. Your identity is sent for review.'
      setNotice({ tone: 'success', text })
      announce(t(text), { toast: true })
      setFocusRequest((n) => n + 1)
    } catch (err) {
      setNotice({ tone: 'error', text: err.message || 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const statusBox =
    'rounded-tile bg-white/70 px-4 py-3 font-body text-sm text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50'

  return (
    <ProfileCard
      id="profile-identity"
      title={t('Identity')}
      intro={t('Verify your National ID so your reports carry more weight.')}
      badge={<VerifyBadge status={identity.status} />}
    >
      <div className="flex flex-col gap-5">
        <IdentityTimeline identity={identity} />

        {identity.status === 'pending' && (
          <div ref={statusRef} tabIndex={-1} className={statusBox}>
            <p className="font-bold">{t('We are checking your details.')}</p>
            <p className="mt-1 text-soft">
              {t('NID ending in {last4}, sent on {date}. A review usually takes 1 to 2 working days.', { last4: identity.nidLast4, date: date(identity.submittedAt) })}
            </p>
            <p className="mt-1 text-soft">{t('Your card photo is deleted as soon as the review is done.')}</p>
          </div>
        )}

        {identity.status === 'verified' && (
          <div ref={statusRef} tabIndex={-1} className={statusBox}>
            <p className="font-bold">{t('Your identity is verified.')}</p>
            <p className="mt-1 text-soft">{`NID ending in ${identity.nidLast4}.`}</p>
          </div>
        )}

        {identity.status === 'rejected' && (
          <div ref={statusRef} tabIndex={-1} className={`${statusBox} border-2 border-alert/30`}>
            <p className="font-bold">{t('We could not verify your identity.')}</p>
            <p className="mt-1 text-soft">
              {t('Reason: {reason}', { reason: identity.reason || t('No reason given.') })}
            </p>
            {!resubmitting && (
              <Button variant="dark" className="mt-3" onClick={() => setResubmitting(true)}>
                {t('Submit again')}
              </Button>
            )}
          </div>
        )}

        {formOpen && (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <TextField
              id="profile-nid"
              label={t('NID number')}
              inputMode="numeric"
              autoComplete="off"
              placeholder={t('10, 13 or 17 digits')}
              maxLength={21}
              value={nid}
              onChange={(e) => {
                setNid(e.target.value)
                setNotice(null)
              }}
              onBlur={() => setNidTouched(true)}
              hint={
                nidDigits === 0
                  ? 'Smart cards have 10 digits, older cards 13 or 17.'
                  : nidDigits === 1
                    ? 'Smart cards have 10 digits, older cards 13 or 17. You typed 1 digit.'
                    : t('Smart cards have 10 digits, older cards 13 or 17. You typed {n} digits.', { n: nidDigits })
              }
              error={nidTouched && nid ? nidError : ''}
              className="sm:max-w-sm"
            />

            <div className="flex flex-col gap-1.5">
              <p id="profile-nid-photo-label" className="font-body text-sm font-semibold text-navy">
                {t('Photo of the front of your NID card')}
              </p>
              <PhotoDropzone
                id="profile-nid-photo"
                labelId="profile-nid-photo-label"
                photo={photo}
                error={photoError}
                onFile={handleFile}
                onRemove={() => {
                  setPhoto(null)
                  setPhotoError('')
                }}
              />
            </div>

            <p className="font-body text-xs text-muted">
              {t('Your full NID number is never stored. Only its last 4 digits and the review status are kept. Your card photo is kept only until an admin reviews it, then deleted.')}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="dark" disabled={!canSubmit}>
                {submitting ? t('Sending…') : t('Send for review')}
              </Button>
              {identity.status === 'rejected' && !submitting && (
                <Button
                  variant="outline"
                  onClick={() => {
                    clearForm()
                    setResubmitting(false)
                  }}
                >
                  {t('Cancel')}
                </Button>
              )}
            </div>
          </form>
        )}

        <FormNotice tone={notice?.tone}>{notice?.text}</FormNotice>
      </div>
    </ProfileCard>
  )
}
