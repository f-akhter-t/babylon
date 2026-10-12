import { useRef, useState } from 'react'
import clsx from 'clsx'
import { ChevronsIcon } from './HomeIcons'

export default function BeforeAfterSlider({
  before,
  after,
  alt = '',
  interactive = true,
  className,
}) {
  const box = useRef(null)
  const dragging = useRef(false)
  const [pos, setPos] = useState(50) // divider position, 0 to 100
  const [broken, setBroken] = useState(false) // a photo failed to load
  const showPhotos = Boolean(before && after) && !broken

  function moveTo(clientX) {
    const rect = box.current.getBoundingClientRect()
    const next = ((clientX - rect.left) / rect.width) * 100
    setPos(Math.min(100, Math.max(0, next)))
  }

  function handlePointerDown(e) {
    if (!interactive) return
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    moveTo(e.clientX)
  }

  function handlePointerMove(e) {
    if (dragging.current) moveTo(e.clientX)
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - 5))
    if (e.key === 'ArrowRight') setPos((p) => Math.min(100, p + 5))
  }

  return (
    <div
      ref={box}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
      className={clsx(
        'relative select-none overflow-hidden bg-slate',
        interactive && 'cursor-ew-resize touch-pan-y',
        className,
      )}
    >
      {showPhotos && (
        <img
          src={before}
          alt={alt ? `${alt}, before` : ''}
          draggable={false}
          loading="lazy"
          onError={() => setBroken(true)}
          className="absolute inset-0 size-full object-cover"
        />
      )}

      {/* After photo, clipped to the right of the divider */}
      <div
        className="absolute inset-0 bg-forest"
        style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
      >
        {showPhotos && (
          <img
            src={after}
            alt={alt ? `${alt}, after` : ''}
            draggable={false}
            loading="lazy"
            onError={() => setBroken(true)}
            className="size-full object-cover"
          />
        )}
      </div>

      <span className="absolute bottom-3.5 left-3.5 rounded-full bg-navy px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-mint">
        Before
      </span>
      <span className="absolute bottom-3.5 right-3.5 rounded-full bg-brand px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-navy">
        After
      </span>

      <div
        className="absolute inset-y-0 w-1 -translate-x-1/2 bg-mint"
        style={{ left: `${pos}%` }}
      >
        {interactive && (
          <div
            role="slider"
            tabIndex={0}
            aria-label="Before and after"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pos)}
            onKeyDown={handleKeyDown}
            className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-navy bg-mint text-navy"
          >
            <ChevronsIcon className="size-4" />
          </div>
        )}
      </div>
    </div>
  )
}