import clsx from 'clsx'

// Small dots to jump between slides. The active dot is wider.
export default function SliderDots({ count, active, onSelect }) {
  return (
    <div className="flex items-center">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`Go to slide ${i + 1}`}
          aria-current={i === active}
          className="group rounded-full p-2 focus-visible:outline-2 focus-visible:outline-brand"
        >
          <span
            className={clsx(
              'block h-2.5 rounded-full transition-all',
              i === active ? 'w-8 bg-brand' : 'w-2.5 bg-mint/40 group-hover:bg-mint/70',
            )}
          />
        </button>
      ))}
    </div>
  )
}
