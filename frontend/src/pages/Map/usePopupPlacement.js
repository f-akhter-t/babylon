import { useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'
import { edgePadding, popupOffset } from './placement'

const MIN_HEIGHT = 120

// Keeps a Leaflet popup beside its pin and fully inside the map.
// Leaflet does the moving (offset, autoPan with padding, maxHeight); this
// hook only sets those options again whenever the popup's content changes
// size (photo loads, "Following…" line, login box) or the map is resized.
// Returns true once the popup has been placed for the first time.
export function usePopupPlacement(popupRef, body, { side, pinHeight, settled }) {
  const map = useMap()
  const [placed, setPlaced] = useState(false)

  useEffect(() => {
    const popup = popupRef.current
    if (!popup || !body) return
    let frame = 0

    const place = () => {
      const container = popup.getElement()
      if (!container || !popup.isOpen()) return
      const pad = edgePadding(map)
      const room = map.getSize().y - pad.topLeft[1] - pad.bottomRight[1]
      const maxHeight = Math.max(room, MIN_HEIGHT) // taller content scrolls inside
      const height = Math.min(body.offsetHeight, maxHeight)
      Object.assign(popup.options, {
        offset: popupOffset(side, container.offsetWidth, height, pinHeight),
        maxHeight,
        autoPan: settled, // never pan while FlyToSelected is still flying
        autoPanPaddingTopLeft: pad.topLeft,
        autoPanPaddingBottomRight: pad.bottomRight,
      })
      popup.update() // re-positions, then pans the map if the popup sticks out
      setPlaced(true)
    }

    // Wait one frame, so several size changes in a row cause one update.
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(place)
    }
    const observer = new ResizeObserver(schedule) // also runs once right away
    observer.observe(body)
    map.on('resize', schedule)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      map.off('resize', schedule)
    }
  }, [map, popupRef, body, side, pinHeight, settled])

  return placed
}
