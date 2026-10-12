import { useEffect, useRef, useState } from 'react'

const styles = `
  @keyframes meshDrift {
    0%   { background-position: 0% 0%; }
    50%  { background-position: 100% 100%; }
    100% { background-position: 0% 0%; }
  }
  @keyframes orbFloatA {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50%      { transform: translate(5vw, 6vh) scale(1.07); }
  }
  @keyframes orbFloatB {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50%      { transform: translate(-6vw, -5vh) scale(1.05); }
  }
  @media (prefers-reduced-motion: reduce) {
    .ab-animate { animation: none !important; }
  }
`

/**
 * Fixed, full-viewport decorative background — darker ash/grey gradient,
 * slowly drifting, plus a subtle mouse-following glow.
 * Purely visual: pointer-events-none, negative z-index, no layout effect.
 */
export default function AnimatedBackground() {
  const [reducedMotion, setReducedMotion] = useState(false)
  const glowRef = useRef(null)
  const rafRef = useRef(null)
  const target = useRef({ x: 50, y: 50 })
  const current = useRef({ x: 50, y: 50 })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (reducedMotion) return

    function onMove(e) {
      target.current = {
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      }
    }

    function tick() {
      current.current.x += (target.current.x - current.current.x) * 0.06
      current.current.y += (target.current.y - current.current.y) * 0.06
      if (glowRef.current) {
        glowRef.current.style.setProperty('--mx', `${current.current.x}%`)
        glowRef.current.style.setProperty('--my', `${current.current.y}%`)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [reducedMotion])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <style>{styles}</style>

      {/* darker ash/grey gradient, slowly drifting */}
      <div
        className="ab-animate absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(135deg, #d6d8db 0%, #c6c9ce 35%, #b7bac0 65%, #a4a8af 100%)',
          backgroundSize: '200% 200%',
          animation: reducedMotion ? 'none' : 'meshDrift 30s ease-in-out infinite',
        }}
      />

      {/* two soft glows, darker ash palette */}
      <div
        className="ab-animate absolute -left-32 -top-32 h-[32rem] w-[32rem] rounded-full bg-slate-400/40 blur-3xl"
        style={{ animation: reducedMotion ? 'none' : 'orbFloatA 26s ease-in-out infinite' }}
      />
      <div
        className="ab-animate absolute -right-32 bottom-[-10%] h-[32rem] w-[32rem] rounded-full bg-zinc-500/30 blur-3xl"
        style={{ animation: reducedMotion ? 'none' : 'orbFloatB 32s ease-in-out infinite' }}
      />

      {/* subtle mouse-following glow */}
      {!reducedMotion && (
        <div
          ref={glowRef}
          className="absolute h-[28vw] w-[28vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-3xl"
          style={{ left: 'var(--mx, 50%)', top: 'var(--my, 50%)' }}
        />
      )}
    </div>
  )
}