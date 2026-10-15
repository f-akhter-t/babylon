import { useInView } from '../../hooks/usePrefersReducedMotion'

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