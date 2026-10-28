import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import { DomEvent } from 'leaflet'
import { MinusIcon, PlusIcon } from '../Map/MapIcons'
import { prefersLessMotion } from '../../components/ui/motion'
import { useT } from '../../i18n/useLanguage'

// 44px on phones and tablets (tap size), 40px from lg up as before.
const BUTTON =
  'flex size-11 items-center justify-center bg-white text-navy transition hover:bg-mint active:bg-mint-deep focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy lg:size-10'

// Small + and − buttons, the zoom control on every map except the Map page's
// own control column (same look). Lives inside the map so it can use useMap().
// position: where it sits, e.g. "right-3 top-3" (the issue page) or "left-3 top-3".
export default function MiniMapZoom({ position = 'right-3 top-3' }) {
  const t = useT()
  const map = useMap()
  const ref = useRef(null)

  // Without this, clicking a button would also drag or zoom the map.
  useEffect(() => {
    DomEvent.disableClickPropagation(ref.current)
    DomEvent.disableScrollPropagation(ref.current)
  }, [])

  return (
    <div
      ref={ref}
      className={`absolute ${position} z-1000 flex flex-col overflow-hidden rounded-chip border border-navy/20 shadow-md`}
    >
      <button type="button" aria-label={t('Zoom in')} onClick={() => map.zoomIn(1, { animate: !prefersLessMotion() })} className={BUTTON}>
        <PlusIcon size={16} />
      </button>
      <span className="h-px bg-ink/15" />
      <button type="button" aria-label={t('Zoom out')} onClick={() => map.zoomOut(1, { animate: !prefersLessMotion() })} className={BUTTON}>
        <MinusIcon size={16} />
      </button>
    </div>
  )
}
