import { useEffect, useRef, useState } from 'react'

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = () => setReduced(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

export function useInView() {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, inView]
}

export function FadeUpCard({ children, index, reducedMotion }) {
  const [ref, inView] = useInView()
  return (
    <div
      ref={ref}
      className="h-full"
      style={{
        opacity: reducedMotion ? 1 : inView ? undefined : 0,
        animation:
          !reducedMotion && inView ? `cardIn 0.45s ease-out ${index * 0.06}s both` : undefined,
      }}
    >
      {children}
    </div>
  )
}