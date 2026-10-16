import { useEffect, useRef, useState } from 'react'

// Turns "shown" to true once, when the element scrolls into view.
// Reduced-motion users (and old browsers) see it at once: the preference is
// read when the element first renders.
// instant: show at once, with no entrance (for example a live update that
// arrived while the tab was hidden).
export default function useReveal(instant = false) {
  const ref = useRef(null)
  const [shown, setShown] = useState(
    () =>
      instant ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window),
  )

  useEffect(() => {
    if (shown || !ref.current) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [shown])

  return { ref, shown }
}