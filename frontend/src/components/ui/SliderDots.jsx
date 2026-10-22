import clsx from 'clsx'

// Small dots to jump between slides. The active dot is a wider pill. Each
// dot has a fixed box, and the dot and the pill fade and scale inside it, so
// changing slides never moves the layout.
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
          className="group flex h-11 min-w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-brand"
        >
          <span aria-hidden="true" className="relative flex h-2.5 w-8 items-center justify-center">
            <span
              className={clsx(
                'absolute size-2.5 rounded-full bg-mint/40 transition duration-300 group-hover:bg-mint/70',
                i === active ? 'scale-50 opacity-0' : 'opacity-100',
              )}
            />
            <span
              className={clsx(
                'absolute inset-0 rounded-full bg-brand transition duration-300',
                i === active ? 'opacity-100' : 'scale-x-[0.3] opacity-0',
              )}
            />
          </span>
        </button>
      ))}
    </div>
  )
}
