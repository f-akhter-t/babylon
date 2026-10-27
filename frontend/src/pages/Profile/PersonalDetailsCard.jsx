import { useEffect, useState } from 'react'
import Button from '../../components/ui/Button'
import ProfileCard from './ProfileCard'
import TextField from './TextField'
import FormNotice from './FormNotice'
import { saveProfile } from '../../services/api'
import { ADDRESS_MAX, NAME_MAX, checkDetails } from '../../utils/profileRules'
import { DIVISIONS } from '../../utils/divisions'
import { useT } from '../../i18n/useLanguage'

const FIELDS = ['name', 'address', 'division']

const fromProfile = (profile) => ({
  name: profile.name,
  address: profile.address,
  division: profile.division,
})

// onStateChange({ dirty, canSave, saving }) lets the page show the phone
// save bar, which submits or resets this form (by formId) from outside the card.
export default function PersonalDetailsCard({ profile, formId, onStateChange, announce }) {
  const t = useT()
  const [saved, setSaved] = useState(() => fromProfile(profile)) // last saved values
  const [form, setForm] = useState(saved)
  const [touched, setTouched] = useState({})
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null) // { tone, text }

  const dirty = FIELDS.some((field) => form[field].trim() !== saved[field])
  const errors = checkDetails(form)
  const valid = !Object.values(errors).some(Boolean)
  const canSave = dirty && valid && !saving

  useEffect(() => {
    onStateChange({ dirty, canSave, saving })
  }, [dirty, canSave, saving, onStateChange])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setNotice(null)
  }

  function blur(field) {
    setTouched((current) => ({ ...current, [field]: true }))
  }

  function discard() {
    setForm(saved)
    setTouched({})
    setNotice(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    setNotice(null)
    try {
      const next = await saveProfile(profile.email, form)
      setSaved(fromProfile(next))
      setForm(fromProfile(next))
      setTouched({})
      const text = 'Your details are saved.'
      setNotice({ tone: 'success', text })
      announce(t(text), { toast: true })
    } catch (err) {
      setNotice({ tone: 'error', text: err.message || 'Something went wrong. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  // Show a problem once the citizen has left the field or changed it.
  const shown = (field) => (touched[field] || form[field] !== saved[field] ? errors[field] : '')

  return (
    <ProfileCard
      id="profile-details"
      title={t('Personal details')}
      intro={t('Departments see your name on your reports. Your division decides where you can report: only inside your own division.')}
    >
      <form
        id={formId}
        onSubmit={handleSubmit}
        onReset={(e) => {
          e.preventDefault() // the form's own reset would clear the fields
          discard()
        }}
        noValidate
        className="flex flex-col gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="profile-name"
            label={t('Full name')}
            value={form.name}
            maxLength={NAME_MAX}
            autoComplete="name"
            onChange={(e) => update('name', e.target.value)}
            onBlur={() => blur('name')}
            error={shown('name')}
          />
          <TextField
            id="profile-email"
            label={t('Email')}
            type="email"
            value={profile.email}
            disabled
            hint={t('Your email is your login, so it cannot be changed here.')}
          />
        </div>

        <TextField
          id="profile-address"
          label={t('Address (optional)')}
          value={form.address}
          maxLength={ADDRESS_MAX}
          autoComplete="street-address"
          placeholder={t('House 12, Road 3, Nasirabad')}
          onChange={(e) => update('address', e.target.value)}
          onBlur={() => blur('address')}
          error={shown('address')}
        />

        <TextField
          id="profile-division"
          label={t('Division')}
          as="select"
          value={form.division}
          onChange={(e) => update('division', e.target.value)}
          onBlur={() => blur('division')}
          error={shown('division')}
          hint={t('You can report problems only inside this division.')}
          className="sm:max-w-xs"
        >
          <option value="" disabled>
            {t('Choose your division')}
          </option>
          {DIVISIONS.map((division) => (
            <option key={division} value={division}>
              {division}
            </option>
          ))}
        </TextField>

        <FormNotice tone={notice?.tone}>{notice?.text}</FormNotice>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="dark" disabled={!canSave}>
            {saving ? t('Saving…') : t('Save details')}
          </Button>
          {dirty && !saving && (
            <Button variant="outline" onClick={discard}>
              {t('Discard changes')}
            </Button>
          )}
        </div>
      </form>
    </ProfileCard>
  )
}
