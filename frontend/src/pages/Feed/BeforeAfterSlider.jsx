import { useRef, useState } from 'react'
import { useT } from '../../i18n/useLanguage'

export default function BeforeAfterSlider({ before, after, alt }) {
  const t = useT()
  const [position, setPosition] = useState(50)
  const [failed, setFailed] = useState(false)
  const containerRef = useRef(null)
  const dragging = useRef(false)

  function updateFromClientX(clientX) {
    const rect = containerRef.current.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.min(100, Math.max(0, pct)))
  }

  function startDrag(clientX) {
    dragging.current = true
    updateFromClientX(clientX)
  }
  function moveDrag(clientX) {
    if (dragging.current) updateFromClientX(clientX)
  }
  function endDrag() {
    dragging.current = false
  }

  if (failed) {
    return (
      <div className="flex h-40 w-full items-center justify-center bg-slate/20 font-body text-xs text-soft">
        {t('Photo not available')}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative h-40 w-full cursor-ew-resize touch-none select-none overflow-hidden"
      onPointerDown={(e) => startDrag(e.clientX)}
      onPointerMove={(e) => moveDrag(e.clientX)}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    >
      <img
        src={after}
        alt={`${alt} — ${t('after')}`}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
        onError={() => setFailed(true)}
      />
      <img
        src={before}
        alt={`${alt} — ${t('before')}`}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        onError={() => setFailed(true)}
      />

      <span className="absolute bottom-2 left-2 rounded-full bg-ink px-2.5 py-1 font-body text-[10px] font-bold text-paper">
        {t('Before').toUpperCase()}
      </span>
      <span className="absolute bottom-2 right-2 rounded-full bg-brand px-2.5 py-1 font-body text-[10px] font-bold text-ink">
        {t('After').toUpperCase()}
      </span>

      <div className="absolute top-0 h-full w-0.5 bg-white" style={{ left: `${position}%` }}>
        <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-navy shadow-md">
          ↔
        </div>
      </div>
    </div>
  )
}