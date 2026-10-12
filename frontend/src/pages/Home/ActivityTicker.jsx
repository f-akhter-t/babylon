import clsx from 'clsx'

const dot = { open: 'bg-amber', 'in-progress': 'bg-mint', resolved: 'bg-brand' }
const label = { open: 'Reported', 'in-progress': 'In progress', resolved: 'Resolved' }

function Items({ items, hidden = false }) {
  return (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-10 pr-10">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-2.5 whitespace-nowrap text-sm font-semibold text-mint"
        >
          <span className={clsx('size-2 rounded-full', dot[item.status])} />
          <span className="text-brand">{label[item.status]}:</span>
          {item.title}
          <span className="text-mint/60">· {item.time}</span>
        </li>
      ))}
    </ul>
  )
}

export default function ActivityTicker({ items }) {
  // Keeps the strip's height while data loads.
  if (!items || items.length === 0) return <div className="mt-10 h-12 bg-navy" />

  return (
    <section
      aria-label="Recent reports"
      className="mt-10 overflow-hidden bg-navy py-3.5 motion-reduce:overflow-x-auto"
    >
      <div className="flex w-max animate-marquee motion-reduce:animate-none hover:[animation-play-state:paused]">
        <Items items={items} />
        <Items items={items} hidden />
      </div>
    </section>
  )
}