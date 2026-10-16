import clsx from 'clsx'
import useReveal from './useReveal'

// Wrap anything. It fades in and slides up a little when it scrolls into view
// (the reveal utility in index.css). For items in a list, pass index: the
// first ten come in one after another (the stagger step), the rest together.
// Or pass delay (in ms) for a fixed wait.
export default function Reveal({ delay = 0, index, className, children }) {
  const { ref, shown } = useReveal()
  const wait =
    index === undefined ? `${delay}ms` : `calc(${Math.min(index, 9)} * var(--stagger-step))`

  return (
    <div
      ref={ref}
      data-shown={shown || undefined}
      style={{ transitionDelay: shown ? wait : '0ms' }}
      className={clsx('reveal', className)}
    >
      {children}
    </div>
  )
}
