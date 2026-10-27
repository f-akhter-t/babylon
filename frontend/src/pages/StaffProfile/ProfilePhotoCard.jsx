import { useState } from 'react'
import ProfileCard from '../Profile/ProfileCard'
import PhotoDropzone from '../Profile/PhotoDropzone'
import { saveStaffPhoto } from '../../services/api'
import { useT } from '../../i18n/useLanguage'

// Optional: a photo for the avatar. It is saved as soon as it is chosen; if it
// cannot be read or kept, the message says so and the old photo stays.
export default function ProfilePhotoCard({ profile, announce }) {
  const t = useT()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save(file, doneText) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await saveStaffPhoto(profile.email, file)
      announce(doneText, { toast: true })
    } catch (err) {
      setError(t(err.message || 'We could not save your photo. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ProfileCard
      id="staff-photo"
      title={t('Photo')}
      intro={t('Optional. Your photo shows in the top bar instead of your initials.')}
    >
      <p id="staff-photo-label" className="sr-only">
        {t('Profile photo')}
      </p>
      <PhotoDropzone
        id="staff-photo-input"
        labelId="staff-photo-label"
        avatar
        alt={t('Your profile photo')}
        busy={busy}
        photo={profile.photo ? { url: profile.photo } : null}
        error={error}
        onFile={(file) => file && save(file, 'Your photo is saved.')}
        onRemove={() => save(null, 'Your photo is removed.')}
      />
      {busy && (
        <p className="mt-2 font-body text-xs text-slate" aria-hidden="true">
          {t('Saving your photo…')}
        </p>
      )}
    </ProfileCard>
  )
}
