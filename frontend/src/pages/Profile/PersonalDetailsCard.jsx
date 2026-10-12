import { useEffect, useState } from 'react'
import Button from '../../components/ui/Button'
import ProfileCard from './ProfileCard'
import TextField from './TextField'
import FormNotice from './FormNotice'
import { saveProfile } from '../../services/api'
import { ADDRESS_MAX, NAME_MAX, WARDS, checkDetails } from '../../utils/profileRules'

const FIELDS = ['name', 'address', 'ward']

const fromProfile = (profile) => ({
  name: profile.name,
  address: profile.address,
  ward: profile.ward,
})

export default function PersonalDetailsCard({ profile, onDirtyChange }) {
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
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

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
      setNotice({ tone: 'success', text: 'Your details are saved.' })
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
      title="Personal details"
      intro="Departments see your name on your reports. Your address and ward help them find you."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="profile-name"
            label="Full name"
            value={form.name}
            maxLength={NAME_MAX}
            autoComplete="name"
            onChange={(e) => update('name', e.target.value)}
            onBlur={() => blur('name')}
            error={shown('name')}
          />
          <TextField
            id="profile-email"
            label="Email"
            type="email"
            value={profile.email}
            disabled
            hint="Your email is your login, so it cannot be changed here."
          />
        </div>

        <TextField
          id="profile-address"
          label="Address (optional)"
          value={form.address}
          maxLength={ADDRESS_MAX}
          autoComplete="street-address"
          placeholder="House 12, Road 3, Nasirabad"
          onChange={(e) => update('address', e.target.value)}
          onBlur={() => blur('address')}
          error={shown('address')}
        />

        <TextField
          id="profile-ward"
          label="Ward"
          as="select"
          value={form.ward}
          onChange={(e) => update('ward', e.target.value)}
          onBlur={() => blur('ward')}
          error={shown('ward')}
          hint="Chattogram City Corporation ward where you live."
          className="sm:max-w-xs"
        >
          <option value="" disabled>
            Choose your ward
          </option>
          {WARDS.map((ward) => (
            <option key={ward} value={ward}>
              {ward}
            </option>
          ))}
        </TextField>

        <FormNotice tone={notice?.tone}>{notice?.text}</FormNotice>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="dark" disabled={!canSave}>
            {saving ? 'Saving…' : 'Save details'}
          </Button>
          {dirty && !saving && (
            <Button variant="outline" onClick={discard}>
              Discard changes
            </Button>
          )}
        </div>
      </form>
    </ProfileCard>
  )
}
