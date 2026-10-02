import { useEffect, useRef, useState } from 'react'
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import { draftPinIcon } from './statusPin'
import { POPUP_CLASSES } from './popupStyles'
import { animate, DROP_IN, SPRING } from './motion'
import DraftCard from './DraftCard'
import RegionNotice from './RegionNotice'
import { isInRegion } from './region'

// "Drop a pin" mode: while active, the next click on the map places a
// draggable pin. Its popup warns about nearby duplicates, then links to
// /report with the pin's coordinates. Pins can only go inside the region
// (see region.js).
export default function DropPin({ active, issues, onPlaced, onStop, onUpvoteInstead }) {
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
  // "important" on the map itself beats the page's grab cursor (see cursors.js).
  useEffect(() => {
    if (!active) return
    const container = map.getContainer()
    container.style.setProperty('cursor', 'var(--cursor-crosshair)', 'important')
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
        title="Your new report. Drag to adjust."
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
      {!dragging && (
        <Popup
          position={spot}
          offset={[0, -40]}
          minWidth={270}
          maxWidth={300}
          closeButton={false}
          closeOnClick={false}
          autoClose={false}
          autoPan={false}
          className={POPUP_CLASSES}
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
        </Popup>
      )}
    </>
  )
}
