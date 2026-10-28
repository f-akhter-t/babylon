import clsx from 'clsx'
import { enter } from '../../components/ui/motion'
import { useT } from '../../i18n/useLanguage'

// Badges a citizen earns by taking part. Everything is worked out from numbers
// the profile already has, so nothing new is stored. Locked badges stay visible
// (faint), with what to do to earn them.
//   user:    { reports, points, level } from getCurrentUser, or null while loading
//   profile: the citizen's profile
// tone classes are written out in full so Tailwind can find them.
const TONES = {
  sky: { on: 'bg-brand/20 text-brand ring-brand/60', dot: 'bg-brand' },
  green: { on: 'bg-flag-green-light/20 text-flag-green-light ring-flag-green-light/60', dot: 'bg-flag-green-light' },
  amber: { on: 'bg-amber/20 text-amber ring-amber/60', dot: 'bg-amber' },
  red: { on: 'bg-flag-red/20 text-flag-red ring-flag-red/60', dot: 'bg-flag-red' },
}

// One small 24x24 drawing per badge (stroke only, so it follows the text colour).
const ICONS = {
  flag: 'M5 21V4m0 0h11l-2 4 2 4H5',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  star: 'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z',
  mail: 'M3 6h18v12H3V6Zm0 0 9 7 9-7',
  phone: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm4 15h.01',
  shield: 'M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6l-8-3Zm-3 9 2.2 2.2L15.5 10',
  check: 'M4 12.5 9.5 18 20 6.5',
  crown: 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8Z',
}

function badgesFor(user, profile) {
  const reports = user?.reports ?? 0
  const level = user?.level ?? 0
  const complete = profile.name.trim() && profile.division && profile.emailVerified && profile.phoneVerified
  return [
    { key: 'first', icon: 'flag', tone: 'sky', name: 'First report', hint: 'File your first report.', earned: reports >= 1 },
    { key: 'watcher', icon: 'eye', tone: 'green', name: 'Street watcher', hint: 'File 5 reports.', earned: reports >= 5 },
    { key: 'dozen', icon: 'star', tone: 'amber', name: 'Dozen club', hint: 'File 12 reports.', earned: reports >= 12 },
    { key: 'email', icon: 'mail', tone: 'sky', name: 'Email verified', hint: 'Verify your email address.', earned: Boolean(profile.emailVerified) },
    { key: 'phone', icon: 'phone', tone: 'green', name: 'Phone verified', hint: 'Verify your mobile number.', earned: Boolean(profile.phoneVerified) },
    { key: 'identity', icon: 'shield', tone: 'red', name: 'Verified citizen', hint: 'Get your identity verified.', earned: profile.identity.status === 'verified' },
    { key: 'complete', icon: 'check', tone: 'green', name: 'All set up', hint: 'Finish your details, email and phone.', earned: Boolean(complete) },
    { key: 'guardian', icon: 'crown', tone: 'amber', name: 'Guardian', hint: 'Reach level 4.', earned: level >= 4 },
  ]
}

export default function Badges({ user, profile }) {
  const t = useT()
  const badges = badgesFor(user, profile)
  const earned = badges.filter((b) => b.earned).length
  const next = badges.find((b) => !b.earned)

  return (
    <section aria-label={t('Your badges')}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-body text-sm font-semibold text-frost">{t('Your badges')}</h3>
        <p className="font-body text-xs text-frost/70">{t('{earned} of {total} earned', { earned, total: badges.length })}</p>
      </div>
      <ul className="mt-3 grid grid-cols-4 gap-x-2 gap-y-3">
        {badges.map((badge, index) => (
          <li
            key={badge.key}
            title={badge.earned ? t(badge.name) : `${t(badge.name)}: ${t(badge.hint)}`}
            className="flex flex-col items-center gap-1.5 text-center"
            style={enter('rise-in', 0.25 + index * 0.06)}
          >
            <span
              aria-hidden="true"
              className={clsx(
                'flex size-11 items-center justify-center rounded-full ring-2',
                badge.earned ? TONES[badge.tone].on : 'border-2 border-dashed border-frost/25 bg-frost/5 text-frost/30',
              )}
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={ICONS[badge.icon]} />
              </svg>
            </span>
            <span className={clsx('font-body text-[11px] font-semibold leading-tight', badge.earned ? 'text-frost' : 'text-frost/55')}>
              {t(badge.name)}
              <span className="sr-only">{`: ${badge.earned ? t('earned') : t('not earned yet')}`}</span>
            </span>
          </li>
        ))}
      </ul>
      {next && (
        <p className="mt-3 rounded-tile bg-frost/[0.07] px-3 py-2 font-body text-xs text-frost/85">
          <span className="font-bold text-amber">{t('Next badge')}:</span> {t(next.name)}. {t(next.hint)}
        </p>
      )}
    </section>
  )
}
