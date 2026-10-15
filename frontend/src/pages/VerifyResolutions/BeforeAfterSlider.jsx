import { useRef, useState } from 'react'

// before and after are image URLs (the after-photo is a data URL). A missing
// photo shows a label in its place.
export default function BeforeAfterSlider({ before, after, title }) {
  const ref = useRef(null)
  const [pos, setPos] = useState(50)

  function move(clientX) {
    const rect = ref.current.getBoundingClientRect()
    const next = ((clientX - rect.left) / rect.width) * 100
    setPos(Math.min(100, Math.max(0, next)))
  }

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId)
    move(e.clientX)
  }

  function onPointerMove(e) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e.clientX)
  }

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      style={{ touchAction: 'none' }}
      className="relative h-[280px] cursor-ew-resize select-none overflow-hidden rounded-card bg-forest"
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
          <span className="absolute left-3/4 top-1/2 -translate-x-1/2 -translate-y-1/2 font-body text-sm font-semibold text-mint">
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
          <span className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 font-body text-sm font-semibold text-mint">
            Citizen photo
          </span>
        )}
      </div>

      <span className="absolute left-4 top-4 rounded-full bg-navy px-3 py-1 font-body text-xs font-bold tracking-widest text-mint">
        BEFORE
      </span>
      <span className="absolute right-4 top-4 rounded-full bg-brand px-3 py-1 font-body text-xs font-bold tracking-widest text-navy">
        AFTER
      </span>

      <div
        className="absolute bottom-0 top-0 w-[3px] -translate-x-1/2 bg-white"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-navy bg-mint font-body text-sm font-bold text-navy">
          ‹ ›
        </div>
      </div>
    </div>
  )
}