import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import { DomEvent } from 'leaflet'
import clsx from 'clsx'
import { MAP_CENTER } from '../../mock/issues'
import { LocateIcon, MinusIcon, PinIcon, PlusIcon } from './MapIcons'

const TILE =
  'flex size-11 items-center justify-center transition duration-150 ease-out motion-safe:active:scale-90'
const IDLE = 'bg-white text-navy hover:bg-mint active:bg-mint-deep'
const ACTIVE = 'bg-navy text-brand hover:bg-navy/90'
const SINGLE = 'rounded-chip border border-navy/20 shadow-md hover:shadow-lg'

// Zoom in, zoom out, "back to my area" and "drop a pin". Lives inside the
// map so it can use useMap() to control it.
export default function MapControls({ dropping, onToggleDrop }) {
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
          aria-label="Zoom in"
          onClick={() => map.zoomIn()}
          className={clsx(TILE, IDLE)}
        >
          <PlusIcon />
        </button>
        <span className="h-px bg-navy/15" />
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => map.zoomOut()}
          className={clsx(TILE, IDLE)}
        >
          <MinusIcon />
        </button>
      </div>

      <button
        type="button"
        aria-label="Back to my area"
        title="Back to my area"
        // Keep the current zoom: only move, don't zoom out.
        onClick={() => map.flyTo(MAP_CENTER, map.getZoom(), { duration: 0.8 })}
        className={clsx(TILE, IDLE, SINGLE)}
      >
        <LocateIcon />
      </button>

      <button
        type="button"
        aria-label="Drop a pin to report an issue"
        aria-pressed={dropping}
        title="Drop a pin to report an issue"
        onClick={onToggleDrop}
        className={clsx(TILE, SINGLE, dropping ? ACTIVE : IDLE)}
      >
        <PinIcon />
      </button>
    </div>
  )
}
