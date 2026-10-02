import { useEffect, useRef } from 'react'
import clsx from 'clsx'

// One full-size background video. Only the active one plays.
// "paused" comes from the Pause button or the reduced-motion setting.
export default function HeroVideo({ video, active, paused }) {
  const ref = useRef(null)

  // Play only when this slide is active and not paused.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (active && !paused) {
      // play() can fail if the browser blocks it. The poster stays, so ignore it.
      el.play().catch(() => {})
    } else {
      el.pause()
    }
  }, [active, paused])

  // Start from the first frame each time the slide comes back.
  useEffect(() => {
    if (ref.current && active) ref.current.currentTime = 0
  }, [active])

  return (
    <div
      aria-hidden="true"
      className={clsx(
        'absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none',
        active ? 'opacity-100' : 'opacity-0',
      )}
    >
      <video
        ref={ref}
        src={video.src}
        poster={video.poster}
        muted
        loop
        playsInline
        preload="metadata"
        className="size-full object-cover"
      />
    </div>
  )
}