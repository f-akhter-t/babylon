import { useEffect, useState } from 'react'
import Button from '../../components/ui/Button'
import ProfileCard from '../Profile/ProfileCard'
import TextField from '../Profile/TextField'
import FormNotice from '../Profile/FormNotice'
import { saveStaffDetails } from '../../services/api'
import { JOB_TITLE_MAX, NAME_MAX, checkJobTitle, checkName } from '../../utils/profileRules'
import { useT } from '../../i18n/useLanguage'

const FIELDS = ['name', 'jobTitle']

const fromProfile = (profile) => ({ name: profile.name, jobTitle: profile.jobTitle })

// Name and job title. Works like the citizen's Personal details: its own Save,
// and onStateChange({ dirty, canSave, saving }) for the phone save bar.
export default function StaffDetailsCard({ profile, formId, onStateChange, announce }) {
  const t = useT()
  const [saved, setSaved] = useState(() => fromProfile(profile)) // last saved values
  const [form, setForm] = useState(saved)
  const [touched, setTouched] = useState({})
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null) // { tone, text }

  const errors = { name: checkName(form.name), jobTitle: checkJobTitle(form.jobTitle) }
  const dirty = FIELDS.some((field) => form[field].trim() !== saved[field])
  const valid = !errors.name && !errors.jobTitle
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
    if (!canSave) {
      // Show every problem at once, so nothing is hidden behind a dead button.
      setTouched({ name: true, jobTitle: true })
      return
    }
    setSaving(true)
    setNotice(null)
    try {
      const next = await saveStaffDetails(profile.email, form)
      setSaved(fromProfile(next))
      setForm(fromProfile(next))
      setTouched({})
      const text = 'Your details are saved.'
      setNotice({ tone: 'success', text })
      announce(text, { toast: true })
    } catch (err) {
      setNotice({ tone: 'error', text: err.message || 'Something went wrong. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  // Show a problem once the field was left or changed. An empty job title on
  // a new account shows only after the first try, not on arrival.
  const shown = (field) => (touched[field] || form[field] !== saved[field] ? errors[field] : '')

  return (
    <ProfileCard
      id="staff-details"
      title={t('Your details')}
      intro={t('Citizens and other staff see your name and job title when you act on a report.')}
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
            id="staff-name"
            label={t('Full name')}
            value={form.name}
            maxLength={NAME_MAX}
            autoComplete="name"
            onChange={(e) => update('name', e.target.value)}
            onBlur={() => blur('name')}
            error={shown('name')}
          />
          <TextField
            id="staff-job-title"
            label={t('Job title')}
            value={form.jobTitle}
            maxLength={JOB_TITLE_MAX}
            autoComplete="organization-title"
            placeholder={t('Road maintenance officer')}
            onChange={(e) => update('jobTitle', e.target.value)}
            onBlur={() => blur('jobTitle')}
            error={shown('jobTitle')}
          />
        </div>

        <TextField
          id="staff-email"
          label={t('Email')}
          type="email"
          value={profile.email}
          disabled
          hint={t('Your email is your login, so it cannot be changed here.')}
          className="sm:max-w-sm"
        />

        <FormNotice tone={notice?.tone}>{notice?.text}</FormNotice>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="dark" disabled={saving || !dirty} className="max-md:min-h-11">
            {saving ? t('Saving…') : t('Save details')}
          </Button>
          {dirty && !saving && (
            <Button variant="outline" onClick={discard} className="max-md:min-h-11">
              {t('Discard changes')}
            </Button>
          )}
        </div>
      </form>
    </ProfileCard>
  )
}
