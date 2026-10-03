import { useEffect, useRef, useState } from 'react'

// Counts from 0 to target when the element scrolls into view.
// Attach `ref` to the element you want to watch.
export default function useCountUp(target, { duration = 1500 } = {}) {
  const ref = useRef(null)
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (typeof target !== 'number') return undefined

    // People who ask for less motion get the final number at once.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const time = reduce ? 0 : duration
    let frame

    function run() {
      const start = performance.now()
      function tick(now) {
        const progress = time === 0 ? 1 : Math.min((now - start) / time, 1)
        const eased = 1 - Math.pow(1 - progress, 3) // fast start, slow end
        setValue(target * eased)
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect()
          run()
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(ref.current)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [target, duration])

  return { ref, value }
}