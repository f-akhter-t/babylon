import { useEffect, useRef, useState } from 'react'
import { Popup } from 'react-leaflet'
import clsx from 'clsx'
import { POPUP_CLASSES, SIDE_CLASSES } from './popupStyles'
import { usePopupPlacement } from './usePopupPlacement'
import { animate, SLIDE_IN, SPRING } from './motion'

// A Leaflet popup that opens beside its pin (side: 'right' | 'left').
// React decides when it is open, so Leaflet's own closing is turned off.
export default function SidePopup({ position, side, width, pinHeight, settled, children }) {
  const popupRef = useRef(null)
  const [body, setBody] = useState(null)
  const placed = usePopupPlacement(popupRef, body, { side, pinHeight, settled })

  // Hidden until it is beside the pin, then it slides out from the pin's side.
  useEffect(() => {
    const container = popupRef.current?.getElement()
    if (!container) return
    if (!placed) {
      container.style.opacity = '0'
      return
    }
    container.style.opacity = ''
    for (const part of container.children) {
      animate(part, SLIDE_IN[side], { duration: 320, easing: SPRING })
    }
  }, [placed, side])

  return (
    <Popup
      ref={popupRef}
      position={position}
      minWidth={width.min}
      maxWidth={width.max}
      closeButton={false}
      closeOnClick={false}
      autoClose={false}
      autoPan={false} // turned on by usePopupPlacement once the map is still
      className={clsx(POPUP_CLASSES, SIDE_CLASSES[side])}
    >
      <div ref={setBody}>{children}</div>
    </Popup>
  )
}
