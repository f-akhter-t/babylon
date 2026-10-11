import { useEffect, useRef, useState } from 'react'

const styles = `
  @keyframes meshDrift {
    0%   { background-position: 0% 0%, 100% 0%, 50% 100%; }
    50%  { background-position: 100% 100%, 0% 100%, 50% 0%; }
    100% { background-position: 0% 0%, 100% 0%, 50% 100%; }
  }
  @keyframes orbFloatA {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%      { transform: translate(6vw, 8vh) scale(1.08); }
    66%      { transform: translate(-4vw, 10vh) scale(0.95); }
  }
  @keyframes orbFloatB {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50%      { transform: translate(-7vw, -6vh) scale(1.1); }
  }
  @keyframes orbFloatC {
    0%, 100% { transform: translate(0, 0) scale(1); }
    40%      { transform: translate(5vw, -9vh) scale(0.92); }
    75%      { transform: translate(-6vw, 4vh) scale(1.05); }
  }
  @keyframes orbFloatD {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50%      { transform: translate(8vw, 5vh) scale(1.06); }
  }
  @media (prefers-reduced-motion: reduce) {
    .ab-animate { animation: none !important; }
  }
`

/**
 * Fixed, full-viewport decorative background — mesh gradient + floating
 * orbs + a soft mouse-following glow. Purely visual: pointer-events-none,
 * negative z-index, no effect on layout or scroll.
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
      // ease toward the cursor instead of snapping — keeps it subtle
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

      {/* base mesh gradient — mint / light blue / off-white, slow drift */}
      <div
        className="ab-animate absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(45% 40% at 20% 25%, rgba(167,243,208,0.55) 0%, rgba(167,243,208,0) 70%),
            radial-gradient(40% 35% at 80% 20%, rgba(191,219,254,0.50) 0%, rgba(191,219,254,0) 70%),
            radial-gradient(55% 50% at 50% 90%, rgba(209,250,229,0.45) 0%, rgba(209,250,229,0) 70%)
          `,
          backgroundColor: '#faf9f6',
          backgroundSize: '160% 160%',
          animation: reducedMotion ? 'none' : 'meshDrift 26s ease-in-out infinite',
        }}
      />

      {/* floating glowing orbs — different sizes, durations, directions */}
      <div
        className="ab-animate absolute -left-20 top-[-10%] h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl"
        style={{ animation: reducedMotion ? 'none' : 'orbFloatA 22s ease-in-out infinite' }}
      />
      <div
        className="ab-animate absolute right-[-6%] top-[10%] h-96 w-96 rounded-full bg-sky-200/40 blur-3xl"
        style={{ animation: reducedMotion ? 'none' : 'orbFloatB 28s ease-in-out infinite' }}
      />
      <div
        className="ab-animate absolute bottom-[-10%] left-[15%] h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl"
        style={{ animation: reducedMotion ? 'none' : 'orbFloatC 32s ease-in-out infinite' }}
      />
      <div
        className="ab-animate absolute bottom-[5%] right-[10%] h-64 w-64 rounded-full bg-sky-100/40 blur-3xl"
        style={{ animation: reducedMotion ? 'none' : 'orbFloatD 24s ease-in-out infinite' }}
      />

      {/* subtle mouse-following glow */}
      {!reducedMotion && (
        <div
          ref={glowRef}
          className="absolute h-[32vw] w-[32vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-3xl"
          style={{ left: 'var(--mx, 50%)', top: 'var(--my, 50%)' }}
        />
      )}
    </div>
  )
}