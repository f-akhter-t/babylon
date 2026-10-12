import { useEffect, useRef } from 'react'

// One full-size background video. Only the active one plays.
// "paused" comes from the Pause button or the reduced-motion setting.
export default function HeroVideo({ video, active, paused, allowed }) {
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
  }, [active, paused, allowed])

  // Start from the first frame each time the slide comes back.
  useEffect(() => {
    if (ref.current && active) ref.current.currentTime = 0
  }, [active])

  // Slow zoom: grows for 9 s while the slide plays.
  // Inactive: wait for the fade-out (700 ms), then reset.
  const zooming = active && !paused
  const style = {
    opacity: active ? 1 : 0,
    transform: zooming ? 'scale(1.08)' : 'scale(1)',
    transition: zooming
      ? 'opacity 700ms, transform 9000ms linear'
      : active
        ? 'opacity 700ms, transform 600ms ease-out'
        : 'opacity 700ms, transform 0s linear 700ms',
  }

  return (
    <div aria-hidden="true" className="absolute inset-0" style={style}>
      {allowed ? (
        <video
          ref={ref}
          src={video.src}
          poster={video.poster}
          muted
          loop
          playsInline
          preload={active ? 'auto' : 'none'}
          className="size-full object-cover"
        />
      ) : (
        <img
          src={video.poster}
          alt=""
          loading={active ? 'eager' : 'lazy'}
          className="size-full object-cover"
        />
      )}
    </div>
  )
}