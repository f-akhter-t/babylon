import { useRef, useState } from 'react'

// Keys for the divider: arrows move it 5 points, Page Up and Page Down 10,
// Home and End to either side.
const KEY_STEP = {
  ArrowLeft: -5,
  ArrowDown: -5,
  ArrowRight: 5,
  ArrowUp: 5,
  PageDown: -10,
  PageUp: 10,
}

const clamp = (value) => Math.min(100, Math.max(0, value))

// before and after are image URLs (the after-photo is a data URL). A missing
// photo shows a label in its place. The divider is a slider for keyboard and
// screen reader users; mouse and touch can drag anywhere on the photo.
// Each photo is announced once, by its alt text: the BEFORE and AFTER badges
// and the placeholder labels are hidden from screen readers.
export default function BeforeAfterSlider({ before, after, title }) {
  const ref = useRef(null)
  const [pos, setPos] = useState(50)
  const percent = Math.round(pos)

  function move(clientX) {
    const rect = ref.current.getBoundingClientRect()
    setPos(clamp(((clientX - rect.left) / rect.width) * 100))
  }

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId)
    move(e.clientX)
  }

  function onPointerMove(e) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e.clientX)
  }

  function onKeyDown(e) {
    let next
    if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = 100
    else if (e.key in KEY_STEP) next = clamp(percent + KEY_STEP[e.key])
    else return
    e.preventDefault()
    setPos(next)
  }

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      // pan-y: a vertical swipe still scrolls the page; a sideways drag moves the divider.
      style={{ touchAction: 'pan-y' }}
      className="relative h-[clamp(11.25rem,35vh,17.5rem)] cursor-ew-resize select-none overflow-hidden rounded-card bg-forest"
    >
      <div className="absolute inset-0 bg-forest">
        {after ? (
          <img
            src={after}
            alt={`The department’s photo of “${title}” after the fix.`}
            draggable={false}
            className="h-full w-full select-none object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute left-3/4 top-1/2 -translate-x-1/2 -translate-y-1/2 font-body text-sm font-semibold text-mint"
          >
            Department after-photo
          </span>
        )}
      </div>

      <div
        className="absolute inset-0 bg-slate"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        {before ? (
          <img
            src={before}
            alt={`The citizen’s photo of “${title}” before the fix.`}
            draggable={false}
            className="h-full w-full select-none object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 font-body text-sm font-semibold text-mint"
          >
            Citizen photo
          </span>
        )}
      </div>

      <span
        aria-hidden="true"
        className="absolute left-4 top-4 rounded-full bg-navy px-3 py-1 font-body text-xs font-bold tracking-widest text-mint"
      >
        BEFORE
      </span>
      <span
        aria-hidden="true"
        className="absolute right-4 top-4 rounded-full bg-brand px-3 py-1 font-body text-xs font-bold tracking-widest text-navy"
      >
        AFTER
      </span>

      <div
        className="absolute bottom-0 top-0 w-[3px] -translate-x-1/2 bg-white"
        style={{ left: `${pos}%` }}
      >
        {/* 44px handle. The focus ring is the app's two-tone ring (index.css). */}
        <div
          role="slider"
          tabIndex={0}
          aria-label="Divider between the before and after photos"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={`The before photo fills ${percent} percent of the view.`}
          onKeyDown={onKeyDown}
          className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-navy bg-mint font-body text-sm font-bold text-navy outline-offset-2"
        >
          <span aria-hidden="true">‹ ›</span>
        </div>
      </div>
    </div>
  )
}
