// src/pages/Home/PreviewMap.jsx
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import 'leaflet/dist/leaflet.css'

// Full class names, so Tailwind can find them. Leaflet adds them to each pin.
const pinColor = {
  open: 'fill-amber stroke-white',
  progress: 'fill-forest stroke-white',
  reopened: 'fill-danger stroke-white',
}

function pinKind(issue) {
  if (issue.priority === 'reopened') return 'reopened'
  if (issue.status === 'in-progress') return 'progress'
  return 'open'
}

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
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {issues.map((issue) => (
          <CircleMarker
            key={issue.id}
            center={[issue.lat, issue.lng]}
            radius={11}
            pathOptions={{ className: pinColor[pinKind(issue)], fillOpacity: 1, weight: 2 }}
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
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Soft green edge where the map meets the card. Desktop only. */}
      {fade && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-[1000] hidden w-28 bg-linear-to-r from-forest to-transparent xl:block" />
      )}
    </div>
  )
}