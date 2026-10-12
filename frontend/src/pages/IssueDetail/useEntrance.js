import { useEffect, useRef } from 'react'
import { animate, RISE_IN } from '../Map/motion'

// Plays a short animation once, when the element first appears.
// Skipped for people who turned on "reduce motion" (see Map/motion.js).
//   const ref = useEntrance(RISE_IN, { delay: 120 })
//   <div ref={ref}>…</div>
export function useEntrance(keyframes = RISE_IN, { delay = 0, duration = 450 } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    animate(ref.current, keyframes, {
      delay,
      duration,
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      fill: 'backwards', // stay hidden during the delay
    })
  }, [keyframes, delay, duration])

  return ref
}

// A line "draws itself": from the top-left corner, so it works for
// both a horizontal line (desktop) and a vertical one (phones).
export const DRAW_LINE = [
  { clipPath: 'inset(0 100% 100% 0)' },
  { clipPath: 'inset(0 0 0 0)' },
]
