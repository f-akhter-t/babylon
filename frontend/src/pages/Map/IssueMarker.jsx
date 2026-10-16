import { useEffect, useRef } from 'react'
import { Marker } from 'react-leaflet'
import { pinIcon } from './statusPin'
import { pinName } from './pinMarkup'
import { animate, DROP_IN, DURATION, EASE, FADE_OUT, SPRING } from '../../components/ui/motion'

// leaving: the report is gone; the pin fades out and cannot be used, then
// PinLayer removes it.
export default function IssueMarker({ issue, selected, onSelect, leaving = false }) {
  const markerRef = useRef(null)
  const name = pinName(issue.title, issue.status)

  // Drop the pin in when it first appears (page load, filters, a badge splitting).
  // We animate the inside of the icon, because Leaflet moves the outer element.
  useEffect(() => {
    const inner = markerRef.current?.getElement()?.firstElementChild
    animate(inner, DROP_IN, { duration: 380, easing: SPRING })
  }, [])

  // A new status (another tab moved the report on) changes the pin's look in
  // place: Leaflet's DivIcon reuses the same element, so a focused pin keeps
  // focus. Leaflet sets the title only once, so keep its name current here.
  useEffect(() => {
    const element = markerRef.current?.getElement()
    if (element) element.title = name
  }, [name])

  useEffect(() => {
    if (!leaving) return
    const element = markerRef.current?.getElement()
    if (!element) return
    element.setAttribute('aria-hidden', 'true')
    element.tabIndex = -1
    element.style.pointerEvents = 'none'
    animate(element.firstElementChild, FADE_OUT, { duration: DURATION.base, easing: EASE, fill: 'forwards' })
  }, [leaving])

  return (
    <Marker
      ref={markerRef}
      position={[issue.lat, issue.lng]}
      icon={pinIcon(issue.status, selected)}
      title={name}
      riseOnHover // a hovered pin comes in front of its neighbours
      zIndexOffset={selected ? 1000 : 0} // selected pin sits on top of the others
      eventHandlers={{ click: () => onSelect(issue.id) }}
    />
  )
}
