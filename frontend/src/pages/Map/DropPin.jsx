import { useEffect, useRef, useState } from 'react'
import { Marker, useMap, useMapEvents } from 'react-leaflet'
import { draftPinIcon } from './statusPin'
import PopupShell from './PopupShell'
import { animate, DROP_IN, SPRING } from '../../components/ui/motion'
import DraftCard from './DraftCard'
import RegionNotice from './RegionNotice'
import { isInRegion } from './region'
import { useT } from '../../i18n/useLanguage'

const DRAFT_WIDTH = { min: 270, max: 300 }

// "Drop a pin" mode: while active, the next click on the map places a
// draggable pin. Its popup warns about nearby duplicates, then links to
// /report with the pin's coordinates. Pins can only go inside the region
// (see region.js).
export default function DropPin({ active, issues, onPlaced, onStop, onUpvoteInstead }) {
  const t = useT()
  const map = useMap()
  const [spot, setSpot] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [drops, setDrops] = useState(0) // counts clicks, to replay the drop animation
  const [blocked, setBlocked] = useState(0) // counts tries outside the region; 0 = no message
  const markerRef = useRef(null)

  useMapEvents({
    click(event) {
      if (!active) return
      const { lat, lng } = event.latlng
      if (!isInRegion(lat, lng)) {
        setBlocked((n) => n + 1) // show the message; drop mode stays on
        return
      }
      setSpot(event.latlng)
      setDrops((n) => n + 1)
      onPlaced()
    },
  })

  // Hide the message about 3 seconds after the latest blocked try.
  useEffect(() => {
    if (blocked === 0) return
    const timer = setTimeout(() => setBlocked(0), 3000)
    return () => clearTimeout(timer)
  }, [blocked])

  // While active: crosshair cursor, and Escape turns the mode off.
  // "important" on the map itself beats the map's grab cursor (index.css).
  useEffect(() => {
    if (!active) return
    const container = map.getContainer()
    container.style.setProperty('cursor', 'var(--cursor-crosshair, crosshair)', 'important')
    const onKey = (event) => {
      if (event.key === 'Escape') onStop()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      container.style.removeProperty('cursor')
      window.removeEventListener('keydown', onKey)
    }
  }, [active, map, onStop])

  useEffect(() => {
    if (drops === 0) return
    const inner = markerRef.current?.getElement()?.firstElementChild
    animate(inner, DROP_IN, { duration: 420, easing: SPRING })
  }, [drops])

  const notice = blocked > 0 && <RegionNotice attempt={blocked} />

  if (!spot) return notice

  return (
    <>
      {notice}
      <Marker
        ref={markerRef}
        position={spot}
        icon={draftPinIcon()}
        draggable
        autoPan // the map follows if you drag the pin to the edge
        zIndexOffset={2000}
        title={t('Your new report. Drag to adjust.')}
        eventHandlers={{
          dragstart: () => setDragging(true),
          dragend: (event) => {
            setDragging(false)
            const { lat, lng } = event.target.getLatLng()
            if (isInRegion(lat, lng)) {
              setSpot(event.target.getLatLng())
            } else {
              // Dragged outside: put the pin back where it was before the drag.
              event.target.setLatLng(spot)
              setBlocked((n) => n + 1)
            }
          },
        }}
      />
      {/* key: a new spot gets a fresh popup, so it picks its side again */}
      {!dragging && (
        <PopupShell
          key={`${spot.lat},${spot.lng}`}
          lat={spot.lat}
          lng={spot.lng}
          width={DRAFT_WIDTH}
          pinHeight={48}
        >
          <DraftCard
            spot={spot}
            issues={issues}
            onCancel={() => setSpot(null)}
            onUpvoteInstead={(issue) => {
              setSpot(null) // no new report needed: remove the draft pin
              onUpvoteInstead(issue)
            }}
          />
        </PopupShell>
      )}
    </>
  )
}
