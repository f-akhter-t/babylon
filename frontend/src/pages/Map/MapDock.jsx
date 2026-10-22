import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import { DomEvent } from 'leaflet'
import { edgePadding, GAP } from './placement'
import { animate, SLIDE_IN, SPRING } from '../../components/ui/motion'

// Phones: the popup content as a card docked at the bottom of the map.
// left-18 keeps the zoom buttons free; the max height keeps the
// "Report an issue" button free, and longer content scrolls inside.
export default function MapDock({ position, pinHeight, settled, children }) {
  const map = useMap()
  const ref = useRef(null)

  // Taps and scrolls on the card must not reach the map underneath.
  useEffect(() => {
    DomEvent.disableClickPropagation(ref.current)
    DomEvent.disableScrollPropagation(ref.current)
    animate(ref.current, SLIDE_IN.dock, { duration: 320, easing: SPRING })
  }, [])

  // Keep the pin visible above the card: pan the map up just enough,
  // whenever the card opens or changes height.
  useEffect(() => {
    if (!settled) return
    const dock = ref.current
    let frame = 0
    const reveal = () => {
      const pinY = map.latLngToContainerPoint(position).y
      const lowest = dock.offsetTop - GAP
      const highest = edgePadding(map).topLeft[1] + pinHeight
      const dy = Math.min(pinY - lowest, pinY - highest)
      if (dy > 0) map.panBy([0, dy])
    }
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(reveal)
    })
    observer.observe(dock)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [map, position, pinHeight, settled])

  return (
    <div
      ref={ref}
      data-toast-clearance
      className="absolute bottom-3 left-18 right-3 z-1001 max-h-[calc(100%-5.75rem)] cursor-default overflow-y-auto rounded-card bg-white shadow-xl"
    >
      {children}
    </div>
  )
}
