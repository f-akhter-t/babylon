import { useEffect, useRef } from 'react'
import { Marker } from 'react-leaflet'
import { pinIcon } from './statusPin'
import { pinName } from './pinMarkup'
import { animate, DROP_IN, SPRING } from './motion'

export default function IssueMarker({ issue, selected, onSelect }) {
  const markerRef = useRef(null)

  // Drop the pin in when it first appears (page load, filters, a badge splitting).
  // We animate the inside of the icon, because Leaflet moves the outer element.
  useEffect(() => {
    const inner = markerRef.current?.getElement()?.firstElementChild
    animate(inner, DROP_IN, { duration: 380, easing: SPRING })
  }, [])

  return (
    <Marker
      ref={markerRef}
      position={[issue.lat, issue.lng]}
      icon={pinIcon(issue.status, selected)}
      title={pinName(issue.title, issue.status)}
      riseOnHover // a hovered pin comes in front of its neighbours
      zIndexOffset={selected ? 1000 : 0} // selected pin sits on top of the others
      eventHandlers={{ click: () => onSelect(issue.id) }}
    />
  )
}
