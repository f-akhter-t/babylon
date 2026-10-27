import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import { DomEvent } from 'leaflet'
import clsx from 'clsx'
import { MAP_CENTER } from '../../utils/geo'
import { LocateIcon, MinusIcon, PinIcon, PlusIcon } from './MapIcons'
import { flyTo, prefersLessMotion } from '../../components/ui/motion'
import { useT } from '../../i18n/useLanguage'

const TILE =
  'flex size-11 items-center justify-center transition duration-150 ease-out motion-safe:active:scale-90'
const IDLE = 'bg-white text-navy hover:bg-mint active:bg-mint-deep'
const ACTIVE = 'bg-ink text-brand hover:bg-ink/90'
const SINGLE = 'rounded-chip border border-navy/20 shadow-md hover:shadow-lg'

// Zoom in, zoom out, "back to my area" and "drop a pin". Lives inside the
// map so it can use useMap() to control it.
// report: 'link' (citizen: the pin button works) | 'login' (guest: the
// button asks them to log in) | 'none' (staff: no pin button)
export default function MapControls({ report, dropping, onToggleDrop }) {
  const t = useT()
  const map = useMap()
  const ref = useRef(null)

  // Without this, clicking a button would also drag, zoom or drop a pin on the map.
  useEffect(() => {
    DomEvent.disableClickPropagation(ref.current)
    DomEvent.disableScrollPropagation(ref.current)
  }, [])

  return (
    <div ref={ref} className="absolute left-4 top-4 z-1000 flex flex-col gap-3">
      <div className="flex flex-col overflow-hidden rounded-chip border border-navy/20 shadow-md">
        <button
          type="button"
          aria-label={t('Zoom in')}
          onClick={() => map.zoomIn(1, { animate: !prefersLessMotion() })}
          className={clsx(TILE, IDLE)}
        >
          <PlusIcon />
        </button>
        <span className="h-px bg-ink/15" />
        <button
          type="button"
          aria-label={t('Zoom out')}
          onClick={() => map.zoomOut(1, { animate: !prefersLessMotion() })}
          className={clsx(TILE, IDLE)}
        >
          <MinusIcon />
        </button>
      </div>

      <button
        type="button"
        aria-label={t('Back to my area')}
        title={t('Back to my area')}
        // Keep the current zoom: only move, don't zoom out.
        onClick={() => flyTo(map, MAP_CENTER, map.getZoom(), { duration: 0.8 })}
        className={clsx(TILE, IDLE, SINGLE)}
      >
        <LocateIcon />
      </button>

      {report !== 'none' && (
        <button
          type="button"
          aria-label={t('Drop a pin to report an issue')}
          aria-pressed={report === 'link' ? dropping : undefined}
          title={t('Drop a pin to report an issue')}
          onClick={onToggleDrop}
          className={clsx(TILE, SINGLE, dropping ? ACTIVE : IDLE)}
        >
          <PinIcon />
        </button>
      )}
    </div>
  )
}
