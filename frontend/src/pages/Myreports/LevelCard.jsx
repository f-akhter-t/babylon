import { CheckIcon } from '../../components/ui/icons'
import { POINTS_PER_REPORT } from '../../services/api'
import CountUp from '../../components/ui/CountUp'
import { useT } from '../../i18n/useLanguage'

const lift = 'transition duration-150 hover:-translate-y-0.5 hover:shadow-lift'

// user = result of getCurrentUser(): { points, level, role, nextTierAt }
export function LevelCard({ user }) {
  const t = useT()
  const points = user?.points ?? 0
  const toNext = user?.nextTierAt != null ? user.nextTierAt - points : null
  return (
    <div className={`flex h-full items-center gap-[22px] rounded-card bg-ink px-6 py-5 text-frost ${lift}`}>
      <svg viewBox="0 0 240 130" className="h-auto w-[120px] flex-none" aria-hidden="true">
        <rect x="92" y="4" width="56" height="22" rx="10" className="fill-slate" />
        <rect x="72" y="28" width="96" height="20" className="fill-slate" opacity=".85" />
        <rect x="52" y="50" width="136" height="20" className="fill-slate" opacity=".7" />
        <rect x="30" y="72" width="180" height="22" className="fill-brand" />
        <path d="M20 98h200v16a10 10 0 0 1-10 10H30a10 10 0 0 1-10-10z" className="fill-mint" />
      </svg>
      <div>
        <div className="text-xs font-bold uppercase tracking-[.16em] text-brand">
          {t('Level {level} · {role}', { level: user?.level ?? 1, role: user?.role ?? 'Newcomer' })}
        </div>
        <div className="my-1 font-heading text-[56px] font-extrabold leading-none tracking-tight">
          <CountUp value={points} duration={1200} />
        </div>
        <p className="text-[13px] opacity-90">
          {toNext === null ? t('You reached the top tier') : t('{points} points to the next tier', { points: toNext })}
        </p>
      </div>
    </div>
  )
}

// items = result of getEarnPoints() (strings, or objects with a label)
export function EarnCard({ items = [] }) {
  const t = useT()
  return (
    <div className={`h-full rounded-card bg-mint p-5 ${lift}`}>
      <h3 className="mb-3 font-heading text-xl font-extrabold tracking-tight">{t('How you earn points')}</h3>
      <ul className="flex flex-col gap-2.5">
        {items.map((item, i) => {
          const text = typeof item === 'string' ? item : item.label ?? item.text ?? item.title
          return (
            <li key={i} className="flex items-center gap-2.5 text-sm">
              <span className="flex-none text-accent"><CheckIcon /></span>
              {t(text)}
            </li>
          )
        })}
      </ul>
      <p className="mt-3 rounded-full bg-mint-deep px-3 py-1.5 text-xs font-bold text-accent">
        {t('Every report you file earns {points} points', { points: POINTS_PER_REPORT })}
      </p>
    </div>
  )
}
