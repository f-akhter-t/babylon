import { useState } from 'react'
import { useViewer } from '../Map/useViewer'
import { useProfile } from '../../hooks/useProfile'
import { useT } from '../../i18n/useLanguage'
import { GREETINGS, dayPart, nationalDay } from '../../utils/greeting'

// A slim line under the navbar. On a national day everyone sees the day's
// message; otherwise a logged-in citizen gets a greeting for the time of day.
// "Close" hides it for the rest of this browser session.
const HIDE_KEY = 'babylon-greeting-hidden'

function wasHidden() {
  try {
    return sessionStorage.getItem(HIDE_KEY) === '1'
  } catch {
    return false
  }
}

export default function Greeting() {
  const t = useT()
  const viewer = useViewer()
  const profile = useProfile()
  const [hidden, setHidden] = useState(wasHidden)

  const now = new Date()
  const special = nationalDay(now)
  const firstName = (profile.name || viewer.session?.name || '').trim().split(/\s+/)[0]
  const text = special
    ? t(special.text)
    : viewer.role === 'citizen' && firstName
      ? t(GREETINGS[dayPart(now)], { name: firstName })
      : null

  if (!text || hidden) return null

  function close() {
    setHidden(true)
    try {
      sessionStorage.setItem(HIDE_KEY, '1')
    } catch {
      // Private mode: it just comes back on the next visit.
    }
  }

  return (
    <div
      role="status"
      className="relative flex items-center justify-center gap-3 border-b border-mint-deep bg-mint px-14 py-2 font-body text-sm font-semibold text-navy"
    >
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-flag-green" />
      <span className="min-w-0 text-center">{text}</span>
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-flag-red" />
      <button
        type="button"
        onClick={close}
        aria-label={t('Close')}
        className="absolute right-2 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-lg text-soft hover:text-navy md:right-6"
      >
        ×
      </button>
    </div>
  )
}
