import { useEffect, useState } from 'react'
import { useViewer } from '../Map/useViewer'
import { useProfile } from '../../hooks/useProfile'
import { useT } from '../../i18n/useLanguage'
import { GREETINGS, dayPart, nationalDay } from '../../utils/greeting'

// A slim line under the navbar. On a national day everyone sees the day's
// message; otherwise a logged-in citizen gets a greeting for the time of day.
// It stays for a few seconds while a green-to-red bar runs out along its
// bottom edge, then fades away and folds up. No button to press.
const SHOW_MS = 6000
const FOLD_MS = 600

export default function Greeting() {
  const t = useT()
  const viewer = useViewer()
  const profile = useProfile()
  const [phase, setPhase] = useState('show') // 'show' -> 'leaving' -> 'gone'

  useEffect(() => {
    const leave = setTimeout(() => setPhase('leaving'), SHOW_MS)
    const gone = setTimeout(() => setPhase('gone'), SHOW_MS + FOLD_MS)
    return () => {
      clearTimeout(leave)
      clearTimeout(gone)
    }
  }, [])

  const now = new Date()
  const special = nationalDay(now)
  const firstName = (profile.name || viewer.session?.name || '').trim().split(/\s+/)[0]
  const text = special
    ? t(special.text)
    : viewer.role === 'citizen' && firstName
      ? t(GREETINGS[dayPart(now)], { name: firstName })
      : null

  if (!text || phase === 'gone') return null

  const leaving = phase === 'leaving'
  return (
    <div
      role="status"
      className={`grid transition-[grid-template-rows,opacity] duration-[600ms] ease-out ${
        leaving ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
      }`}
    >
      <div className="overflow-hidden">
        <div className="relative flex items-center justify-center gap-3 border-b border-mint-deep bg-mint px-5 py-2.5 font-body text-sm font-semibold text-navy">
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-flag-green" />
          <span className="min-w-0 text-center">{text}</span>
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-flag-red" />
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-linear-to-r from-flag-green to-flag-red"
            style={{ animation: `greeting-run ${SHOW_MS}ms linear both` }}
          />
        </div>
      </div>
    </div>
  )
}
