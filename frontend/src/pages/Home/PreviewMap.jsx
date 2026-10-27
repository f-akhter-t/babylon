// src/pages/Home/PreviewMap.jsx
import { MapContainer, Marker, Polygon, Popup, TileLayer } from 'react-leaflet'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import 'leaflet/dist/leaflet.css'
import { pinIcon } from '../Map/statusPin'
import { pinName } from '../Map/pinMarkup'
import { REGION_OUTLINE } from '../Map/region'
import { mapMotionOptions } from '../../components/ui/motion'
import { useT } from '../../i18n/useLanguage'

export default function PreviewMap({ issues, className, fade = false }) {
  const t = useT()
  // "isolate" keeps Leaflet's high z-index inside this box, so it never covers the navbar.
  const frame = clsx(
    'relative isolate aspect-[4/3] w-full overflow-hidden rounded-tile',
    className,
  )

  if (issues.length === 0) return <div className={clsx(frame, 'bg-map-land')} />

  // The preview always shows the whole country, not just where the pins are.
  const lats = REGION_OUTLINE.map(([lat]) => lat)
  const lngs = REGION_OUTLINE.map(([, lng]) => lng)
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
        boundsOptions={{ padding: [24, 24] }}
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
        {/* Bangladesh's outline, in the theme's steel blue (forest), so the whole country reads at a glance. */}
        <Polygon
          positions={REGION_OUTLINE}
          pathOptions={{ color: '#3E6990', weight: 2, fillColor: '#3E6990', fillOpacity: 0.06 }}
          interactive={false}
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
                {t(issue.category)} · {issue.location}
              </p>
              <Link
                to={`/issues/${issue.id}`}
                className="mt-1 block font-heading text-base font-extrabold leading-tight text-navy hover:underline"
              >
                {issue.title}
              </Link>
              <p className="mt-1 text-sm font-semibold text-soft">{t('{n} upvotes', { n: issue.votes })}</p>
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