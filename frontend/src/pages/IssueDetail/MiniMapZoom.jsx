import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import { DomEvent } from 'leaflet'
import { MinusIcon, PlusIcon } from '../Map/MapIcons'

const BUTTON =
  'flex size-10 items-center justify-center bg-white text-navy transition hover:bg-mint active:bg-mint-deep focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy'

// Small + and − buttons for the mini map. Lives inside the map so it can use useMap().
export default function MiniMapZoom() {
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
      className="absolute right-3 top-3 z-1000 flex flex-col overflow-hidden rounded-chip border border-navy/20 shadow-md"
    >
      <button type="button" aria-label="Zoom in" onClick={() => map.zoomIn()} className={BUTTON}>
        <PlusIcon size={16} />
      </button>
      <span className="h-px bg-navy/15" />
      <button type="button" aria-label="Zoom out" onClick={() => map.zoomOut()} className={BUTTON}>
        <MinusIcon size={16} />
      </button>
    </div>
  )
}
