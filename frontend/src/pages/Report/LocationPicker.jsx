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
  html: `<div class="pin-wrap">
    <span class="pin-pulse"></span>
    <span class="pin-shadow"></span>
    <div class="pin-body">
      <svg viewBox="0 0 40 52" class="h-[52px] w-10 text-navy drop-shadow-md" aria-hidden="true">
        <path class="fill-current" d="M20 0C9 0 0 8.7 0 19.5 0 33 20 52 20 52s20-19 20-32.5C40 8.7 31 0 20 0z"/>
        <circle cx="20" cy="19" r="8" class="fill-brand"/>
      </svg>
    </div>
  </div>`,
  iconSize: [40, 52],
  iconAnchor: [20, 52],
  tooltipAnchor: [0, -52],
})

const matchIcon = L.divIcon({
  className: 'report-pin',
  html: `<div class="pin-wrap">
    <span class="pin-pulse match-pulse"></span>
    <div class="pin-body">
      <svg viewBox="0 0 40 52" class="h-10 w-[31px] text-amber drop-shadow" aria-hidden="true">
        <path class="fill-current" d="M20 0C9 0 0 8.7 0 19.5 0 33 20 52 20 52s20-19 20-32.5C40 8.7 31 0 20 0z"/>
        <circle cx="20" cy="19" r="7" class="fill-navy"/>
      </svg>
    </div>
  </div>`,
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

  @keyframes pickerIn {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes pickerPop {
    from { opacity: 0; transform: translateY(10px) scale(0.97); }
    to { opacity: 1; transform: none; }
  }
  @keyframes pinPulse {
    0% { transform: scale(0.5); opacity: 0.5; }
    100% { transform: scale(3); opacity: 0; }
  }
  @keyframes pinDrop {
    0% { transform: translateY(-20px); }
    55% { transform: translateY(0) scaleY(0.9); }
    100% { transform: translateY(0); }
  }

  /* the pin: lifts on hover, floats while dragged, bounces when it lands */
  .report-pin { background: transparent; border: 0; }
  .report-pin .pin-wrap { position: relative; width: 100%; height: 100%; }
  .report-pin .pin-body {
    position: absolute;
    inset: 0;
    transform-origin: 50% 100%;
    transition: transform 0.2s ease-out;
  }
  .report-pin:hover .pin-body { transform: translateY(-4px); }
  .report-pin.is-dragging .pin-body { transform: translateY(-12px) scale(1.1); }
  .report-pin .pin-body.pin-drop { animation: pinDrop 0.45s ease-out; }
  .report-pin .pin-shadow {
    position: absolute;
    left: 50%;
    bottom: -2px;
    width: 18px;
    height: 6px;
    margin-left: -9px;
    border-radius: 9999px;
    background: color-mix(in srgb, var(--color-navy) 30%, transparent);
    filter: blur(2px);
    transition: transform 0.2s, opacity 0.2s;
  }
  .report-pin.is-dragging .pin-shadow { transform: scale(0.6); opacity: 0.5; }
  .report-pin .pin-pulse {
    position: absolute;
    left: 50%;
    bottom: -7px;
    width: 14px;
    height: 14px;
    margin-left: -7px;
    border-radius: 9999px;
    background: var(--color-forest);
    animation: pinPulse 1.8s ease-out infinite;
  }
  .report-pin .match-pulse { background: var(--color-amber); }
  .report-pin.is-dragging .pin-pulse { display: none; }
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

// Optional, for editing a report (the Report page leaves them out):
//   excludeId: the issue being edited, never counted as a match or as "nearest".
//   showMatches: false hides the "Looks like a match nearby" card.
//   initialPlace: { label, ward } shown while the pin is still at `initial`.
export default function LocationPicker({
  category,
  onChange,
  onToast,
  initial,
  excludeId,
  showMatches = true,
  initialPlace,
}) {
  const [position, setPosition] = useState(() => initial ?? START)
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
      if (typeof issue.lat !== 'number' || String(issue.id) === String(excludeId)) continue
      const distance = distanceInMeters(markerPosition, [issue.lat, issue.lng])
      if (!best || distance < best.distance) best = { issue, distance }
    }
    return best
  }, [issues, markerPosition, excludeId])

  // A possible duplicate: an unresolved issue right next to the pin
  // (same category, once the citizen has picked one).
  const match = useMemo(() => {
    if (!showMatches) return null
    let best = null
    for (const issue of issues) {
      if (typeof issue.lat !== 'number' || String(issue.id) === String(excludeId)) continue
      if (issue.status === 'resolved' || dismissed.includes(issue.id)) continue
      if (category && issue.category !== category) continue
      const distance = distanceInMeters(markerPosition, [issue.lat, issue.lng])
      if (distance <= MATCH_RADIUS_M && (!best || distance < best.distance)) {
        best = { issue, distance }
      }
    }
    return best
  }, [issues, dismissed, category, markerPosition, showMatches, excludeId])

  const atInitial =
    Boolean(initialPlace && initial) && position.lat === initial.lat && position.lng === initial.lng
  let label =
    placeName || (nearest && nearest.distance <= 500 ? nearest.issue.location : '') || 'Dropped pin'
  let ward = nearest && nearest.distance <= 2500 ? nearest.issue.ward : ''
  if (atInitial) {
    label = initialPlace.label
    ward = initialPlace.ward ?? ''
  }

  useEffect(() => {
    onChange?.({ lat: position.lat, lng: position.lng, label, ward })
  }, [position.lat, position.lng, label, ward, onChange])

  function moveTo(next) {
    setPosition(next)
    setFlyTarget({ ...next, zoom: 17, nonce: Date.now() })
  }

  const eventHandlers = useMemo(
    () => ({
      dragstart(e) {
        setHintVisible(false)
        e.target.getElement()?.classList.add('is-dragging')
      },
      dragend(e) {
        e.target.getElement()?.classList.remove('is-dragging')
        const { lat, lng } = e.target.getLatLng()
        setPosition({ lat, lng })
      },
    }),
    [],
  )

  // a little bounce each time the pin lands somewhere new
  useEffect(() => {
    const body = markerRef.current?.getElement()?.querySelector('.pin-body')
    if (!body) return
    body.classList.remove('pin-drop')
    void body.offsetWidth // restart the animation
    body.classList.add('pin-drop')
  }, [position.lat, position.lng])

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
      className="relative isolate min-h-[560px] overflow-hidden rounded-card bg-mint shadow-sm transition-shadow duration-300 hover:shadow-xl"
      style={{ animation: 'pickerIn 0.55s ease-out 0.2s both' }}
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
            className="w-full rounded-full border border-navy/15 bg-white py-2.5 pl-10 pr-4 font-body text-sm text-navy shadow-sm transition placeholder:text-muted hover:border-forest/50 focus:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
          />
        </div>
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          className="group shrink-0 rounded-full border border-navy/15 bg-white px-4 py-2.5 font-body text-sm font-semibold text-navy shadow-sm transition hover:-translate-y-0.5 hover:bg-mint hover:shadow-md active:scale-95 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
        >
          <span className="inline-flex items-center gap-1.5">
            <svg
              viewBox="0 0 24 24"
              className={`h-4 w-4 text-forest transition-transform duration-300 group-hover:scale-110 ${locating ? 'animate-pulse' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="7" />
              <circle cx="12" cy="12" r="2" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
            {locating ? 'Locating…' : 'Use my location'}
          </span>
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
          <div
            key={match.issue.id}
            className="pointer-events-auto max-w-sm rounded-2xl border-2 border-amber-dark bg-white p-4 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            style={{ animation: 'pickerPop 0.35s ease-out both' }}
          >
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
                className="rounded-full bg-forest px-4 py-2 font-body text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-forest/90 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/60 focus-visible:ring-offset-2"
              >
                ↑ Upvote it instead
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-full border-2 border-amber-dark px-4 py-2 font-body text-sm font-bold text-navy transition hover:-translate-y-0.5 hover:bg-amber/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
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
          className="pointer-events-auto rounded-2xl bg-white px-4 py-3 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl md:ml-auto"
        >
          <p className="font-body text-xs text-muted">Selected location</p>
          <p
            key={label}
            className="font-body text-sm font-bold text-navy"
            style={{ animation: 'pickerPop 0.3s ease-out both' }}
          >
            {label}
            {ward ? `, ${ward}` : ''}
          </p>
        </div>
      </div>
    </section>
  )
}
