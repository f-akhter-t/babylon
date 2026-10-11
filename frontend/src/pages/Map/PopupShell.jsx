import { useEffect, useMemo, useState } from 'react'
import { useMap } from 'react-leaflet'
import SidePopup from './SidePopup'
import MapDock from './MapDock'
import { chooseSide, shouldDock } from './placement'
import { useSettled } from './useSettled'

// Wraps the content of a map popup. On wide maps it opens beside its pin;
// when the map is too narrow for that (phones), it is docked at the bottom.
// width: { min, max } in pixels. pinHeight: height of the pin it belongs to.
// waitForFly: the map is flying to this pin (FlyToSelected), so it will end
// up in the middle of the map, and the map must not be moved until it lands.
export default function PopupShell({ lat, lng, width, pinHeight, waitForFly = false, children }) {
  const map = useMap()
  const position = useMemo(() => [lat, lng], [lat, lng])
  const settled = useSettled(waitForFly)
  const [docked, setDocked] = useState(() => shouldDock(map, width.max))

  // The side is chosen once, so the popup never flips while it is open.
  const [side] = useState(() => {
    const pinX = waitForFly ? map.getSize().x / 2 : map.latLngToContainerPoint(position).x
    return chooseSide(map, pinX, width.max)
  })

  useEffect(() => {
    const check = () => setDocked(shouldDock(map, width.max))
    map.on('resize', check)
    return () => map.off('resize', check)
  }, [map, width.max])

  if (docked) {
    return (
      <MapDock position={position} pinHeight={pinHeight} settled={settled}>
        {children}
      </MapDock>
    )
  }
  return (
    <SidePopup
      position={position}
      side={side}
      width={width}
      pinHeight={pinHeight}
      settled={settled}
    >
      {children}
    </SidePopup>
  )
}
