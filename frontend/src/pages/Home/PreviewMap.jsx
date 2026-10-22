// src/pages/Home/PreviewMap.jsx
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import 'leaflet/dist/leaflet.css'
import { pinIcon } from '../Map/statusPin'
import { pinName } from '../Map/pinMarkup'
import { mapMotionOptions } from '../../components/ui/motion'

export default function PreviewMap({ issues, className, fade = false }) {
  // "isolate" keeps Leaflet's high z-index inside this box, so it never covers the navbar.
  const frame = clsx(
    'relative isolate aspect-[4/3] w-full overflow-hidden rounded-tile',
    className,
  )

  if (issues.length === 0) return <div className={clsx(frame, 'bg-map-land')} />

  const lats = issues.map((i) => i.lat)
  const lngs = issues.map((i) => i.lng)
  const bounds = [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ]

  return (
    <div className={frame}>
      <MapContainer
        {...mapMotionOptions()}
        // "bounds" is only read once, so a new key rebuilds the map when the pins change.
        key={issues.map((i) => i.id).join('-')}
        bounds={bounds}
        boundsOptions={{ padding: [60, 60] }}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        zoomControl={false}
        className="size-full [&_.leaflet-tile-pane]:saturate-[0.45] [&_.leaflet-tile-pane]:brightness-[0.97]"
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {issues.map((issue) => (
          // The Map page's pins: the colour follows the status, as there.
          <Marker
            key={issue.id}
            position={[issue.lat, issue.lng]}
            icon={pinIcon(issue.status)}
            title={pinName(issue.title, issue.status)}
            riseOnHover
          >
            <Popup>
              <p className="text-xs font-bold uppercase tracking-widest text-navy">
                {issue.category} · {issue.location}
              </p>
              <Link
                to={`/issues/${issue.id}`}
                className="mt-1 block font-heading text-base font-extrabold leading-tight text-navy hover:underline"
              >
                {issue.title}
              </Link>
              <p className="mt-1 text-sm font-semibold text-slate">{issue.votes} upvotes</p>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Soft green edge where the map meets the card. Desktop only. */}
      {fade && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-[1000] hidden w-28 bg-linear-to-r from-forest to-transparent xl:block" />
      )}
    </div>
  )
}