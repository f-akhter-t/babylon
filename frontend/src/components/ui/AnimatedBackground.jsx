import { useEffect, useRef, useState } from 'react'
import { prefersLessMotion } from './motion'

// Fixed, full-window decorative background: an ash-grey gradient that drifts
// slowly, two soft glows in the theme's slate and navy, and a faint glow that
// follows the pointer. Purely visual: no pointer events, behind everything,
// and `contain: strict`, so it never costs the page any layout.
// Only transform moves (the drift and float keyframes in index.css). The
// glows are soft radial gradients, so nothing is blurred while it moves.
// It pauses while the tab is hidden and stays still for reduced motion.
const GRADIENT =
  'linear-gradient(135deg, #FFFFFF 0%, color-mix(in srgb, var(--color-page) 70%, white) 35%, color-mix(in srgb, var(--color-brand) 28%, white) 70%, color-mix(in srgb, var(--color-brand) 42%, white) 100%)'
const glow = (color, strength) =>
  `radial-gradient(circle closest-side, color-mix(in srgb, ${color} ${strength}%, transparent), transparent)`

export default function AnimatedBackground() {
  const [still, setStill] = useState(prefersLessMotion)
  const [hidden, setHidden] = useState(() => document.visibilityState === 'hidden')
  const pointerRef = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMotion = () => setStill(mq.matches)
    const onVisibility = () => setHidden(document.visibilityState === 'hidden')
    mq.addEventListener('change', onMotion)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      mq.removeEventListener('change', onMotion)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // The pointer glow eases towards the pointer, and the loop stops once it
  // has caught up, so an idle page does no work.
  useEffect(() => {
    if (still || hidden) return
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const current = { ...target }
    let frame = 0

    function tick() {
      current.x += (target.x - current.x) * 0.06
      current.y += (target.y - current.y) * 0.06
      if (pointerRef.current) {
        pointerRef.current.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%)`
      }
      const settled = Math.abs(target.x - current.x) < 0.5 && Math.abs(target.y - current.y) < 0.5
      frame = settled ? 0 : requestAnimationFrame(tick)
    }
    function onMove(e) {
      target.x = e.clientX
      target.y = e.clientY
      if (!frame) frame = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    frame = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [still, hidden])

  const play = (animation) => (still ? undefined : { animation, animationPlayState: hidden ? 'paused' : 'running' })

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ contain: 'strict' }}
    >
      {/* the ash-grey gradient, twice the window, drifting slowly */}
      <div
        className="absolute -inset-1/2 will-change-transform"
        style={{ backgroundImage: GRADIENT, ...play('drift 30s ease-in-out infinite') }}
      />

      {/* two soft glows */}
      <div
        className="absolute -left-32 -top-32 size-[32rem] will-change-transform"
        style={{ backgroundImage: glow('var(--color-brand)', 45), ...play('float-a 26s ease-in-out infinite') }}
      />
      <div
        className="absolute -right-32 bottom-[-10%] size-[32rem] will-change-transform"
        style={{ backgroundImage: glow('var(--color-forest)', 14), ...play('float-b 32s ease-in-out infinite') }}
      />

      {/* the faint glow that follows the pointer */}
      {!still && (
        <div
          ref={pointerRef}
          className="absolute left-0 top-0 size-[28vw] will-change-transform"
          style={{
            backgroundImage: glow('white', 25),
            transform: 'translate3d(50vw, 50vh, 0) translate(-50%, -50%)',
          }}
        />
      )}
    </div>
  )
}
