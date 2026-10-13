import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

// Fades and slides its child up 0.1s after it scrolls into view (once).
// Keep hover effects on the child, not here, so the two transforms never fight.
export default function Reveal({ children, delay = 100, className }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window)) { setShown(true); return }
    let timer
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        timer = setTimeout(() => setShown(true), delay)
        io.disconnect()
      }
    }, { threshold: 0.1 })
    io.observe(el)
    return () => { io.disconnect(); clearTimeout(timer) }
  }, [delay])

  return (
    <div
      ref={ref}
      className={clsx('transition duration-500 ease-out', shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0', className)}
    >
      {children}
    </div>
  )
}
