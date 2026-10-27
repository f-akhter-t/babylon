import { useState } from 'react'
import clsx from 'clsx'
import { PauseIcon, PlayIcon } from './HomeIcons'
import { useT } from '../../i18n/useLanguage'

const dot = { open: 'bg-amber', 'in-progress': 'bg-mint', resolved: 'bg-brand' }
const label = { open: 'Reported', 'in-progress': 'In progress', resolved: 'Resolved' }

function Items({ items, hidden = false }) {
  const t = useT()
  return (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-10 pr-10">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-2.5 whitespace-nowrap text-sm font-semibold text-frost"
        >
          <span className={clsx('size-2 rounded-full', dot[item.status])} />
          <span className="text-brand">{t(label[item.status])}:</span>
          {item.title}
          <span className="text-frost/60">· {t(item.time)}</span>
        </li>
      ))}
    </ul>
  )
}

export default function ActivityTicker({ items }) {
  const t = useT()
  // Like the hero slides: people who asked for less motion start paused,
  // and anyone can pause or play it with the button.
  const [paused, setPaused] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  // Set once Play is pressed, so the marquee moves at its normal speed even
  // with reduced motion on (see .ticker-played in index.css).
  const [played, setPlayed] = useState(false)

  // Keeps the strip's height while data loads.
  if (!items || items.length === 0) return <div className="mt-10 h-12 bg-ink" />

  function toggle() {
    if (paused) setPlayed(true)
    setPaused(!paused)
  }

  return (
    <section aria-label={t('Recent reports')} className="mt-10 flex items-center bg-ink">
      {/* Hovering or focusing the moving track pauses it. The button sits
          outside the track, so it never holds the ticker paused itself. */}
      <div className="group/track min-w-0 flex-1 overflow-hidden py-3.5">
        <div
          className={clsx(
            'flex w-max animate-marquee group-hover/track:[animation-play-state:paused] group-focus-within/track:[animation-play-state:paused]',
            paused && '[animation-play-state:paused]',
            played && 'ticker-played',
          )}
        >
          <Items items={items} />
          <Items items={items} hidden />
        </div>
      </div>
      <button
        type="button"
        aria-pressed={paused}
        aria-label={t('Pause the recent reports ticker')}
        onClick={toggle}
        className="mx-2 flex size-11 shrink-0 items-center justify-center rounded-full border border-frost/40 text-frost transition-colors hover:bg-frost/10 motion-reduce:transition-none sm:mx-4"
      >
        {paused ? <PlayIcon /> : <PauseIcon />}
      </button>
    </section>
  )
}
