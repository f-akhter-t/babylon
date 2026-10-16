import { useState } from 'react'
import clsx from 'clsx'
import Button from '../../components/ui/Button'
import { setupMissing } from '../../services/api'

// "a, b and c"
function joinList(items) {
  if (items.length < 2) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

function Item({ done, children }) {
  return (
    <li className="flex items-center gap-3 font-body text-sm text-navy">
      <span
        aria-hidden="true"
        className={clsx(
          'flex size-6 shrink-0 items-center justify-center rounded-full',
          done ? 'bg-brand text-navy' : 'border-2 border-navy/25',
        )}
      >
        {done && (
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5 9-10" />
          </svg>
        )}
      </span>
      <span>
        {children}
        <span className="sr-only">{done ? ', done.' : ', still needed.'}</span>
      </span>
    </li>
  )
}

// Staff setup: what is done, what is still needed, and the one button that
// ends the setup. The button works only once every required item is saved
// and verified; unsaved details count as not done yet.
export default function SetupChecklist({ profile, detailsDirty, onFinish }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const missing = setupMissing(profile)
  const ready = missing.length === 0 && !detailsDirty
  const isDepartment = profile.role === 'department'

  let status
  if (missing.length) {
    status = `Still needed: ${joinList(missing)}.`
    if (detailsDirty) status += ' Save your details too.'
  } else if (detailsDirty) {
    status = 'Save your details to finish.'
  } else {
    status = 'Everything is ready. You can finish now.'
  }

  async function handleFinish() {
    if (!ready || busy) return
    setBusy(true)
    setError('')
    try {
      await onFinish()
    } catch (err) {
      setError(err.message || 'We could not finish your setup. Please try again.')
      setBusy(false)
    }
  }

  return (
    <section
      aria-labelledby="setup-checklist-heading"
      className="rounded-card bg-navy p-5 text-mint shadow-sm sm:p-6"
    >
      <h2 id="setup-checklist-heading" className="font-heading text-xl font-extrabold text-mint">
        Setup checklist
      </h2>
      <p className="mt-1 font-body text-sm text-mint/80">
        A photo and a new password are optional.
      </p>
      <ul className="mt-4 flex flex-col gap-3 rounded-tile bg-mint p-4">
        <Item done={!missing.includes('a valid name') && !missing.includes('a job title') && !detailsDirty}>
          Name and job title saved
        </Item>
        <Item done={!missing.includes('a verified phone number')}>Phone number verified</Item>
        {isDepartment && (
          <Item done={!missing.includes('a verified department code')}>Department verified</Item>
        )}
      </ul>
      <p id="setup-status" className="mt-4 font-body text-sm font-semibold text-mint">
        {status}
      </p>
      {error && (
        <p role="alert" className="mt-3 rounded-tile bg-mint px-4 py-2.5 font-body text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <Button
        variant="brand"
        disabled={!ready || busy}
        aria-describedby="setup-status"
        onClick={handleFinish}
        className="mt-4 min-h-11 w-full"
      >
        {busy ? 'Finishing…' : 'Finish setup'}
      </Button>
    </section>
  )
}
