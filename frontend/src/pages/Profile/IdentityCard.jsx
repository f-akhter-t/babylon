import { useEffect, useRef, useState } from 'react'
import Button from '../../components/ui/Button'
import ProfileCard from './ProfileCard'
import TextField from './TextField'
import FormNotice from './FormNotice'
import VerifyBadge from './VerifyBadge'
import { submitIdentity } from '../../services/api'
import { checkIdPhoto, checkNid, normalizeNid } from '../../utils/profileRules'
import { formatDate } from '../../utils/format'

// The full NID number and the photo live only in this component's state.
// They are cleared after submitting and never written to browser storage.
export default function IdentityCard({ profile, onDirtyChange }) {
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
  const inputRef = useRef(null)

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

  function handleFile(file) {
    if (!file) return
    const problem = checkIdPhoto(file)
    if (problem) {
      setPhotoError(problem)
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
    if (inputRef.current) inputRef.current.value = '' // lets the same file be chosen again
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
      setNotice({ tone: 'success', text: 'Thank you. Your identity is sent for review.' })
    } catch (err) {
      setNotice({ tone: 'error', text: err.message || 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ProfileCard
      id="profile-identity"
      title="Identity"
      intro="Verify your National ID so your reports carry more weight."
      badge={<VerifyBadge status={identity.status} />}
    >
      <div className="flex flex-col gap-4">
        {identity.status === 'pending' && (
          <div className="rounded-tile bg-white/70 px-4 py-3 font-body text-sm text-navy">
            <p className="font-bold">We are checking your details.</p>
            <p className="mt-1 text-slate">
              {`NID ending in ${identity.nidLast4}, sent on ${formatDate(identity.submittedAt)}. A review usually takes 1 to 2 working days.`}
            </p>
          </div>
        )}

        {identity.status === 'verified' && (
          <div className="rounded-tile bg-white/70 px-4 py-3 font-body text-sm text-navy">
            <p className="font-bold">Your identity is verified.</p>
            <p className="mt-1 text-slate">{`NID ending in ${identity.nidLast4}.`}</p>
          </div>
        )}

        {identity.status === 'rejected' && (
          <div className="rounded-tile border-2 border-danger/30 bg-white/70 px-4 py-3 font-body text-sm text-navy">
            <p className="font-bold">We could not verify your identity.</p>
            <p className="mt-1 text-slate">
              {`Reason: ${identity.reason || 'No reason given.'}`}
            </p>
            {!resubmitting && (
              <Button variant="dark" className="mt-3" onClick={() => setResubmitting(true)}>
                Submit again
              </Button>
            )}
          </div>
        )}

        {formOpen && (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <TextField
              id="profile-nid"
              label="NID number"
              inputMode="numeric"
              autoComplete="off"
              placeholder="10, 13 or 17 digits"
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
                  : `Smart cards have 10 digits, older cards 13 or 17. You typed ${nidDigits} digits.`
              }
              error={nidTouched && nid ? nidError : ''}
              className="sm:max-w-sm"
            />

            <div className="flex flex-col gap-1.5">
              <p id="profile-nid-photo-label" className="font-body text-sm font-semibold text-navy">
                Photo of the front of your NID card
              </p>
              <input
                ref={inputRef}
                id="profile-nid-photo"
                type="file"
                accept="image/*"
                className="sr-only"
                aria-labelledby="profile-nid-photo-label"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              {photo ? (
                <div className="flex flex-wrap items-center gap-4 rounded-tile bg-white/70 p-3">
                  <img
                    src={photo.url}
                    alt="Preview of your NID card photo"
                    className="h-20 w-32 rounded-chip object-cover"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="truncate font-body text-xs text-navy">{photo.file.name}</span>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => inputRef.current?.click()}>
                        Choose another
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPhoto(null)
                          if (inputRef.current) inputRef.current.value = ''
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  aria-describedby="profile-nid-photo-label"
                  onClick={() => inputRef.current?.click()}
                  className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-tile border-2 border-dashed border-forest/60 bg-white/70 px-4 text-center transition hover:border-forest hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50 sm:max-w-sm"
                >
                  <span className="font-body text-sm font-semibold text-navy">Choose a photo</span>
                  <span className="font-body text-xs text-muted">JPG, PNG or WebP, up to 5 MB</span>
                </button>
              )}
              {photoError && (
                <p role="alert" className="font-body text-xs font-semibold text-danger">
                  {photoError}
                </p>
              )}
            </div>

            <p className="font-body text-xs text-muted">
              Only the last 4 digits of your NID and the review status are kept on this device. The
              full number and the photo are not stored.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="dark" disabled={!canSubmit}>
                {submitting ? 'Sending…' : 'Send for review'}
              </Button>
              {identity.status === 'rejected' && !submitting && (
                <Button
                  variant="outline"
                  onClick={() => {
                    clearForm()
                    setResubmitting(false)
                  }}
                >
                  Cancel
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
