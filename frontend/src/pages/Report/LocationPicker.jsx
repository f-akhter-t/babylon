import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import { getIssues, upvoteIssue } from '../../services/api'
import { MAP_CENTER } from '../../mock/issues'
import { distanceInMeters } from '../../utils/geo'

const START = { lat: MAP_CENTER[0], lng: MAP_CENTER[1] }
const MATCH_RADIUS_M = 120 // an open issue this close counts as a possible duplicate

// Colours come from the Tailwind theme (text-navy, fill-brand, ...), not hex values.
const pinIcon = L.divIcon({
  className: 'report-pin',
  html: `<svg viewBox="0 0 40 52" class="h-[52px] w-10 text-navy drop-shadow-md" aria-hidden="true">
    <path class="fill-current" d="M20 0C9 0 0 8.7 0 19.5 0 33 20 52 20 52s20-19 20-32.5C40 8.7 31 0 20 0z"/>
    <circle cx="20" cy="19" r="8" class="fill-brand"/>
  </svg>`,
  iconSize: [40, 52],
  iconAnchor: [20, 52],
  tooltipAnchor: [0, -52],
})

const matchIcon = L.divIcon({
  className: 'report-pin',
  html: `<svg viewBox="0 0 40 52" class="h-10 w-[31px] text-amber drop-shadow" aria-hidden="true">
    <path class="fill-current" d="M20 0C9 0 0 8.7 0 19.5 0 33 20 52 20 52s20-19 20-32.5C40 8.7 31 0 20 0z"/>
    <circle cx="20" cy="19" r="7" class="fill-navy"/>
  </svg>`,
  iconSize: [31, 40],
  iconAnchor: [15, 40],
})

const pickerStyle = `
  .drag-hint.leaflet-tooltip {
    background: var(--color-navy);
    border: 0;
    border-radius: 9999px;
    box-shadow: none;
    color: white;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 12px;
  }
  .drag-hint.leaflet-tooltip-top::before { border-top-color: var(--color-navy); }
`

// Moves the map when the pin is set from search or "Use my location".
function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], target.zoom, { duration: 0.8 })
  }, [target, map])
  return null
}

// Clicking the map drops the pin there.
function ClickToPlace({ onPlace }) {
  useMapEvents({
    click(e) {
      onPlace({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

export default function LocationPicker({ category, onChange, onToast }) {
  const [position, setPosition] = useState(START)
  const [placeName, setPlaceName] = useState('')
  const [issues, setIssues] = useState([])
  const [dismissed, setDismissed] = useState([])
  const [hintVisible, setHintVisible] = useState(true)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [message, setMessage] = useState('')
  const [flyTarget, setFlyTarget] = useState(null)
  const markerRef = useRef(null)

  const markerPosition = useMemo(() => [position.lat, position.lng], [position.lat, position.lng])

  useEffect(() => {
    let active = true
    getIssues().then((list) => {
      if (active) setIssues(list)
    })
    return () => {
      active = false
    }
  }, [])

  // Street name for the pin, from OpenStreetMap. One request after each move.
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&accept-language=en&lat=${position.lat}&lon=${position.lng}`,
          { signal: controller.signal },
        )
        if (!res.ok) throw new Error('Reverse lookup failed')
        const data = await res.json()
        const a = data.address ?? {}
        setPlaceName(a.road || a.neighbourhood || a.suburb || a.city_district || '')
      } catch (err) {
        if (err.name !== 'AbortError') setPlaceName('')
      }
    }, 500)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [position.lat, position.lng])

  // The closest known issue: used for the ward and as a fallback place name.
  const nearest = useMemo(() => {
    let best = null
    for (const issue of issues) {
      if (typeof issue.lat !== 'number') continue
      const distance = distanceInMeters(markerPosition, [issue.lat, issue.lng])
      if (!best || distance < best.distance) best = { issue, distance }
    }
    return best
  }, [issues, markerPosition])

  // A possible duplicate: an unresolved issue right next to the pin
  // (same category, once the citizen has picked one).
  const match = useMemo(() => {
    let best = null
    for (const issue of issues) {
      if (typeof issue.lat !== 'number') continue
      if (issue.status === 'resolved' || dismissed.includes(issue.id)) continue
      if (category && issue.category !== category) continue
      const distance = distanceInMeters(markerPosition, [issue.lat, issue.lng])
      if (distance <= MATCH_RADIUS_M && (!best || distance < best.distance)) {
        best = { issue, distance }
      }
    }
    return best
  }, [issues, dismissed, category, markerPosition])

  const label =
    placeName || (nearest && nearest.distance <= 500 ? nearest.issue.location : '') || 'Dropped pin'
  const ward = nearest && nearest.distance <= 2500 ? nearest.issue.ward : ''

  useEffect(() => {
    onChange?.({ lat: position.lat, lng: position.lng, label, ward })
  }, [position.lat, position.lng, label, ward, onChange])

  function moveTo(next) {
    setPosition(next)
    setFlyTarget({ ...next, zoom: 17, nonce: Date.now() })
  }

  const eventHandlers = useMemo(
    () => ({
      dragstart() {
        setHintVisible(false)
      },
      dragend() {
        const marker = markerRef.current
        if (!marker) return
        const { lat, lng } = marker.getLatLng()
        setPosition({ lat, lng })
      },
    }),
    [],
  )

  async function handleSearch(e) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setMessage('')
    try {
      // known issues first, so search also works offline with the mock data
      const known = (await getIssues({ search: q })).find((i) => typeof i.lat === 'number')
      if (known) {
        moveTo({ lat: known.lat, lng: known.lng })
        return
      }

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=bd&accept-language=en&viewbox=91.70,22.45,91.95,22.25&q=${encodeURIComponent(q)}`,
      )
      if (!res.ok) throw new Error('Search failed')
      const results = await res.json()
      if (results.length === 0) {
        setMessage('No place found. Try a street or landmark in Chattogram.')
        return
      }
      moveTo({ lat: Number(results[0].lat), lng: Number(results[0].lon) })
    } catch {
      setMessage('Search is not available right now. You can drag the pin instead.')
    } finally {
      setSearching(false)
    }
  }

  function handleLocate() {
    if (!navigator.geolocation) {
      setMessage('This browser cannot share your location.')
      return
    }
    setLocating(true)
    setMessage('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        moveTo({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        setLocating(false)
        setMessage('Could not get your location. Allow location access, or search for a street.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function handleUpvote() {
    if (!match) return
    const { issue } = match
    await upvoteIssue(issue.id)
    setDismissed((list) => [...list, issue.id])
    getIssues().then(setIssues)
    onToast?.(`Upvoted "${issue.title}". No need to report it again.`)
  }

  function handleDismiss() {
    if (match) setDismissed((list) => [...list, match.issue.id])
  }

  return (
    <section
      aria-label="Choose the location"
      className="relative isolate min-h-[560px] overflow-hidden rounded-card bg-mint"
    >
      <style>{pickerStyle}</style>

      <MapContainer
        center={markerPosition}
        zoom={16}
        scrollWheelZoom
        className="absolute inset-0 z-0 h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyTo target={flyTarget} />
        <ClickToPlace onPlace={setPosition} />

        <Circle
          center={markerPosition}
          radius={MATCH_RADIUS_M}
          pathOptions={{
            interactive: false,
            className: 'stroke-forest fill-forest/10 stroke-2 [stroke-dasharray:6_6]',
          }}
        />

        {match && (
          <Marker
            position={[match.issue.lat, match.issue.lng]}
            icon={matchIcon}
            interactive={false}
          />
        )}

        <Marker
          ref={markerRef}
          position={markerPosition}
          icon={pinIcon}
          draggable
          alt="Report location pin"
          zIndexOffset={1000}
          eventHandlers={eventHandlers}
        >
          {hintVisible && (
            <Tooltip permanent direction="top" offset={[0, 0]} className="drag-hint">
              Drag the pin to adjust
            </Tooltip>
          )}
        </Marker>
      </MapContainer>

      {/* search + my location */}
      <form
        role="search"
        onSubmit={handleSearch}
        className="absolute left-16 right-4 top-3 z-[1000] flex gap-2"
      >
        <div className="relative min-w-0 flex-1">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search street or landmark"
            aria-label="Search street or landmark"
            className="w-full rounded-full border border-navy/15 bg-white py-2.5 pl-10 pr-4 font-body text-sm text-navy shadow-sm placeholder:text-muted focus:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
          />
        </div>
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          className="shrink-0 rounded-full border border-navy/15 bg-white px-4 py-2.5 font-body text-sm font-semibold text-navy shadow-sm transition hover:bg-mint disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
        >
          {locating ? 'Locating…' : 'Use my location'}
        </button>
        <span className="sr-only" aria-live="polite">
          {searching ? 'Searching' : ''}
        </span>
      </form>

      {message && (
        <p
          role="status"
          className="absolute left-16 top-16 z-[1000] max-w-xs rounded-xl bg-white px-3 py-2 font-body text-xs font-semibold text-navy shadow"
        >
          {message}
        </p>
      )}

      {/* duplicate match + selected location */}
      <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[1000] flex flex-col items-stretch gap-3 md:flex-row md:items-end md:justify-between">
        {match ? (
          <div className="pointer-events-auto max-w-sm rounded-2xl border-2 border-amber-dark bg-white p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <StaircaseIcon level={1} className="h-5 w-5 text-amber-dark" />
              <h3 className="font-heading text-base font-extrabold text-navy">
                Looks like a match nearby
              </h3>
            </div>
            <p className="mt-2 font-body text-sm text-navy">
              {match.issue.title} · {Math.round(match.distance)} m away · {match.issue.votes}{' '}
              upvotes. Upvoting tells authorities what matters most.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleUpvote}
                className="rounded-full bg-forest px-4 py-2 font-body text-sm font-bold text-white transition hover:bg-forest/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/60 focus-visible:ring-offset-2"
              >
                ↑ Upvote it instead
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-full border-2 border-amber-dark px-4 py-2 font-body text-sm font-bold text-navy transition hover:bg-amber/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
              >
                Mine is different
              </button>
            </div>
          </div>
        ) : (
          <span />
        )}

        <div
          aria-live="polite"
          className="pointer-events-auto rounded-2xl bg-white px-4 py-3 shadow-lg md:ml-auto"
        >
          <p className="font-body text-xs text-muted">Selected location</p>
          <p className="font-body text-sm font-bold text-navy">
            {label}
            {ward ? `, ${ward}` : ''}
          </p>
        </div>
      </div>
    </section>
  )
}
