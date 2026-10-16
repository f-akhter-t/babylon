import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { animate, DURATION, EASE, FADE_IN } from './motion'

// One calm fade when the page changes: the new page's <main> fades in. Enter
// only, opacity only, and nothing waits for it, so focus moves (such as the
// staff setup heading), scrolling to the top and the loading screen all work
// as before. animate() skips it for reduced motion and for a hidden tab.
// The navbar and the staff sidebar stay still.
const TRIES = 30 // frames to wait for a page whose code is still loading

export default function RouteFade() {
  const { pathname } = useLocation()
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false // the first page load has its own entrances
      return
    }
    let frame = 0
    let tries = 0
    const fade = () => {
      const main = document.querySelector('main')
      if (main) {
        animate(main, FADE_IN, { duration: DURATION.base - 50, easing: EASE })
        return
      }
      if (++tries < TRIES) frame = requestAnimationFrame(fade)
    }
    fade()
    return () => cancelAnimationFrame(frame)
  }, [pathname])

  return null
}
