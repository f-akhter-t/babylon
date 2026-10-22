import 'leaflet/dist/leaflet.css'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { Browser } from 'leaflet'
import { formatDistance } from '../../utils/format'
import { pinIcon } from '../Map/statusPin'
import { PinIcon } from '../Map/MapIcons'
import MiniMapZoom from './MiniMapZoom'
import { ExternalLinkIcon } from './DetailIcons'
import { mapMotionOptions } from '../../components/ui/motion'

// Same tiles and credit as the big map (IssueMap.jsx).
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

// A small map with one pin on this issue. The mouse wheel scrolls the page,
// not the map. On phones, one finger scrolls the page too (no dragging).
export default function IssueMiniMap({ issue }) {
  const position = [issue.lat, issue.lng]
  const place = `${issue.location}, ${issue.ward} · ${formatDistance(issue.distanceM)} away`
  const fullMap = `https://www.openstreetmap.org/?mlat=${issue.lat}&mlon=${issue.lng}#map=17/${issue.lat}/${issue.lng}`

  return (
    <section aria-label="Location on the map">
      {/* isolate keeps Leaflet's own z-index values inside this box (under the navbar). */}
      <div className="relative isolate h-60 overflow-hidden rounded-panel shadow-lg shadow-navy/10 lg:h-64">
        <MapContainer
          {...mapMotionOptions()}
          center={position}
          zoom={16}
          zoomControl={false}
          scrollWheelZoom={false}
          dragging={!Browser.mobile}
          className="absolute! inset-0 bg-map-land!"
        >
          <TileLayer attribution={ATTRIBUTION} url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={position} icon={pinIcon(issue.status, true)} interactive={false} keyboard={false} />
          <MiniMapZoom />
        </MapContainer>

        <p className="pointer-events-none absolute left-3 top-3 z-1000 flex max-w-[calc(100%-5rem)] items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-navy shadow-md">
          <PinIcon size={16} className="shrink-0" />
          <span className="truncate">{place}</span>
        </p>
      </div>

      {/* Below the map, not on it: on phones it would cover the map's credit line. */}
      <a
        href={fullMap}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto flex min-h-11 w-fit items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-navy hover:underline focus-visible:outline-2 focus-visible:outline-navy"
      >
        Open in OpenStreetMap
        <ExternalLinkIcon size={14} />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </section>
  )
}
