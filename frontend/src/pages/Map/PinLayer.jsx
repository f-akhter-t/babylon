import { useEffect, useRef, useState } from 'react'
import { Marker, useMap, useMapEvents } from 'react-leaflet'
import { latLngBounds } from 'leaflet'
import IssueMarker from './IssueMarker'
import { clusterIcon } from './statusPin'
import { groupNearby } from './clusters'
import { animate, DROP_IN, DURATION, flyToBounds, prefersLessMotion, SPRING } from '../../components/ui/motion'

function ClusterMarker({ cluster, onClick }) {
  const markerRef = useRef(null)
  const count = cluster.issues.length

  // Pop the badge in when pins merge into it.
  useEffect(() => {
    const inner = markerRef.current?.getElement()?.firstElementChild
    animate(inner, DROP_IN, { duration: 380, easing: SPRING })
  }, [])

  return (
    <Marker
      ref={markerRef}
      position={[cluster.lat, cluster.lng]}
      icon={clusterIcon(count)}
      title={`${count} reports here. Click to zoom in.`}
      riseOnHover
      eventHandlers={{ click: onClick }}
    />
  )
}

// Draws every pin. Pins that would overlap at the current zoom become one
// round count badge; clicking the badge zooms in until they split apart.
// Pins are keyed by report id. A pin whose report has gone (deleted in another
// tab, or filtered out) fades out briefly before it is removed; reduced
// motion or a hidden tab removes it at once.
export default function PinLayer({ issues, selectedId, onSelect }) {
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())
  // Compared by ids, not by array: the page passes a new array on every
  // render, and only a pin that really went needs to fade out.
  const ids = issues.map((issue) => String(issue.id)).join(',')
  const [pins, setPins] = useState({ ids, issues, leaving: [] })
  if (ids !== pins.ids) {
    const now = new Set(issues.map((issue) => String(issue.id)))
    const quiet = prefersLessMotion() || document.visibilityState === 'hidden'
    const gone = quiet ? [] : pins.issues.filter((issue) => !now.has(String(issue.id)))
    const stillLeaving = pins.leaving.filter((issue) => !now.has(String(issue.id)))
    setPins({ ids, issues, leaving: [...stillLeaving, ...gone] })
  }
  const leavingCount = pins.leaving.length
  useEffect(() => {
    if (!leavingCount) return
    const timer = setTimeout(() => setPins((current) => ({ ...current, leaving: [] })), DURATION.base)
    return () => clearTimeout(timer)
  }, [leavingCount])

  useMapEvents({ zoomend: () => setZoom(map.getZoom()) })

  const { singles, clusters } = groupNearby(map, zoom, issues, selectedId)

  const zoomInto = (cluster) => {
    const bounds = latLngBounds(cluster.issues.map((issue) => [issue.lat, issue.lng]))
    flyToBounds(map, bounds, { padding: [80, 80], maxZoom: 18, duration: 0.8 })
  }

  return (
    <>
      {singles.map((issue) => (
        <IssueMarker
          key={issue.id}
          issue={issue}
          selected={issue.id === selectedId}
          onSelect={onSelect}
        />
      ))}

      {pins.leaving.map((issue) => (
        <IssueMarker key={issue.id} issue={issue} leaving onSelect={() => {}} />
      ))}

      {clusters.map((cluster) => (
        <ClusterMarker key={cluster.id} cluster={cluster} onClick={() => zoomInto(cluster)} />
      ))}
    </>
  )
}
