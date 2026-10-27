import { useEffect, useRef, useState } from 'react'
import { prefersLessMotion } from './motion'
import { useNumber } from '../../i18n/useLanguage'

// A number that counts up from 0 the first time it scrolls into view. After
// that, a new value (a live update, another period) shows at once.
// Screen readers get only the final value, never the counting steps.
// Reduced motion or a hidden tab: the final value at once. The final value
// sits invisibly in the same spot, so the box has its final width from the
// start and never grows while it counts.
//   <CountUp value={176} />
//   <CountUp value={4.8} format={(n) => `${n.toFixed(1)} days`} />
export default function CountUp({ value, format: customFormat, duration = 1500, className }) {
  const num = useNumber()
  const format = customFormat ?? ((n) => num(Math.round(n).toLocaleString('en-US')))
  const ref = useRef(null)
  const started = useRef(false)
  // 1 once counting is done (or skipped); the shown value is value * progress.
  // Reduced motion starts (and stays) at the final value.
  const [progress, setProgress] = useState(() => (prefersLessMotion() ? 1 : 0))
  const ready = typeof value === 'number'

  useEffect(() => {
    if (!ready || started.current) return
    const element = ref.current
    let frame
    function run() {
      started.current = true
      if (prefersLessMotion() || document.visibilityState === 'hidden') {
        setProgress(1)
        return
      }
      const start = performance.now()
      function tick(now) {
        // A frame's time can be a moment before start: never go below 0.
        const t = Math.min(Math.max((now - start) / duration, 0), 1)
        setProgress(1 - Math.pow(1 - t, 3)) // fast start, slow end
        if (t < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        run()
      },
      { threshold: 0.3 },
    )
    observer.observe(element)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [ready, duration])

  if (!ready) return <span className={className}>–</span>

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: 'inline-grid', fontVariantNumeric: 'tabular-nums' }}
    >
      <span aria-hidden="true" style={{ gridArea: '1 / 1', visibility: 'hidden' }}>
        {format(value)}
      </span>
      <span aria-hidden="true" data-count style={{ gridArea: '1 / 1' }}>
        {format(progress >= 1 ? value : value * progress)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </span>
  )
}
