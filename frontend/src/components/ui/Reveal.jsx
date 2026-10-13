import clsx from 'clsx'
import useReveal from './useReveal'

// Wrap anything. It fades in and slides up a little when it scrolls into view.
// "delay" (in ms) lets cards in a row appear one after another.
export default function Reveal({ delay = 0, className, children }) {
  const { ref, shown } = useReveal()

  return (
    <div
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
      className={clsx(
        'transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        className,
      )}
    >
      {children}
    </div>
  )
}