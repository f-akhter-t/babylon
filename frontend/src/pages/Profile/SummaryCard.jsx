import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import CountUp from '../../components/ui/CountUp'
import VerifyBadge from './VerifyBadge'
import CompletenessMeter from './CompletenessMeter'
import { getCurrentUser } from '../../services/api'

function initialsFor(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

// Points and level come from the same rule as the Alerts page (60 per report).
// The points count up and the bar fills from empty when the card appears.
// showMeter: false during first-time setup, where the welcome block shows it.
export default function SummaryCard({ profile, showMeter = true }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    let ignore = false
    getCurrentUser(profile.email).then((result) => {
      if (!ignore) setUser(result)
    })
    return () => {
      ignore = true
    }
  }, [profile.email])

  const maxed = user?.nextTierAt === null
  const toNext = user && !maxed ? Math.max(user.nextTierAt - user.points, 0) : 0
  const progress = user && !maxed ? Math.min(100, (user.points / user.nextTierAt) * 100) : 100

  return (
    <aside
      aria-label="Your summary"
      className="flex flex-col gap-5 rounded-card bg-navy p-6 text-mint shadow-sm"
    >
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand font-heading text-xl font-extrabold text-navy"
        >
          {initialsFor(profile.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-heading text-xl font-extrabold">{profile.name}</p>
          <p className="truncate font-body text-sm text-mint/70">{profile.email}</p>
        </div>
      </div>

      {user ? (
        <div>
          <div className="flex items-center gap-2">
            <StaircaseIcon level={Math.min(user.level, 3)} className="h-5 w-5 text-brand" />
            <p className="font-body text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              {`Level ${user.level} · ${user.role}`}
            </p>
          </div>
          <p className="mt-2 font-heading text-5xl font-extrabold leading-none">
            <CountUp value={user.points} duration={1200} />
            <span className="sr-only"> points</span>
          </p>
          <p className="mt-1 font-body text-sm text-mint/80">
            {user.reports === 1 ? 'points from 1 report' : `points from ${user.reports} reports`}
          </p>
          <div
            role="progressbar"
            aria-label="Progress to the next level"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            className="mt-4 h-2 overflow-hidden rounded-full bg-mint/15"
          >
            {/* Scaled, not resized, so the bar never changes the layout. */}
            <div
              className="h-full origin-left transition-transform duration-500"
              style={{ transform: `scaleX(${progress / 100})` }}
            >
              <div
                className="h-full origin-left rounded-full bg-brand"
                style={{ animation: 'grow-x 1.1s var(--ease-calm) 0.3s both' }}
              />
            </div>
          </div>
          <p className="mt-2 font-body text-xs text-mint/70">
            {maxed
              ? 'You reached the top level.'
              : `${toNext} points to reach level ${user.level + 1}.`}
          </p>
        </div>
      ) : (
        <div role="status" className="flex flex-col gap-2">
          <span className="sr-only">Loading your points…</span>
          <div aria-hidden="true" className="h-5 w-32 rounded-full bg-mint/10 skeleton" />
          <div aria-hidden="true" className="h-12 w-24 rounded-tile bg-mint/10 skeleton" />
        </div>
      )}

      {showMeter ? (
        <div className="border-t border-mint/15 pt-4">
          <CompletenessMeter profile={profile} />
        </div>
      ) : (
        <div aria-hidden="true" className="border-t border-mint/15" />
      )}

      <ul className="flex flex-col gap-2 font-body text-sm">
        <li className="flex items-center justify-between gap-3">
          <span>Mobile number</span>
          <VerifyBadge status={profile.phoneVerified ? 'verified' : 'not-verified'} onDark />
        </li>
        <li className="flex items-center justify-between gap-3">
          <span>Identity</span>
          <VerifyBadge status={profile.identity.status} onDark />
        </li>
      </ul>

      <Link
        to="/my-reports"
        // min-h-11 -my-3: a 44px tap area without changing the card's spacing.
        className="-my-3 inline-flex min-h-11 items-center self-start rounded-full font-body text-sm font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
      >
        See your alerts and points
      </Link>
    </aside>
  )
}
