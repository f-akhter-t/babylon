function Staircase({ level }) {
  // Top to bottom. minLevel = the level at which this step turns green.
  const steps = [
    { w: 'w-[21%]', minLevel: 5, round: 'rounded-t-xl' },
    { w: 'w-[41%]', minLevel: 4, round: '' },
    { w: 'w-[61%]', minLevel: 3, round: '' },
    { w: 'w-[81%]', minLevel: 2, round: '' },
    { w: 'w-full', minLevel: 0, round: 'rounded-b-lg', base: true },
  ]

  return (
    <div className="mx-auto flex w-56 flex-col items-center gap-[3px]" aria-hidden="true">
      {steps.map((s, i) => {
        const lit = level >= s.minLevel
        const color = s.base ? 'bg-mint' : lit ? 'bg-brand' : 'bg-slate'
        return (
          <div
            key={i}
            style={{ transitionDelay: `${(steps.length - i) * 80}ms` }}
            className={`h-[19px] ${s.w} ${s.round} ${color} transition-colors duration-500`}
          />
        )
      })}
    </div>
  )
}

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-forest"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export default function AlertsLevelCard({ user, earnPoints }) {
  const maxed = user.nextTierAt === null
  const toNext = maxed ? 0 : Math.max(user.nextTierAt - user.points, 0)

  return (
    <>
      <div className="rounded-card bg-navy px-6 py-8 text-center">
        <Staircase level={user.level} />
        <p className="mt-6 font-body text-xs font-semibold uppercase tracking-[0.18em] text-brand">
          Level {user.level} · {user.role}
        </p>
        <p className="mt-1 font-heading text-6xl font-extrabold leading-none text-mint">
          {user.points}
        </p>
        <p className="mt-2 font-body text-sm text-mint/80">
          {maxed ? 'You reached the top tier' : `${toNext} points to add the next tier`}
        </p>
      </div>

      <div className="rounded-card bg-mint px-6 py-6">
        <h2 className="font-heading text-lg font-extrabold text-navy">How you earn points</h2>
        <ul className="mt-3 space-y-2.5">
          {earnPoints.map((item) => (
            <li key={item} className="flex items-center gap-3 font-body text-sm text-navy">
              <Check />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}