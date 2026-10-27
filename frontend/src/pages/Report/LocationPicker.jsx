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
import { distanceInMeters, MAP_CENTER } from '../../utils/geo'
import { divisionFromPlaceName } from '../../utils/divisions'
import { DRAFT_PIN_SIZE, draftPinSvg } from '../Map/pinMarkup'
import { pinIcon } from '../Map/statusPin'
import MiniMapZoom from '../IssueDetail/MiniMapZoom'
import { enter, flyTo, mapMotionOptions } from '../../components/ui/motion'
import { useT } from '../../i18n/useLanguage'

const START = { lat: MAP_CENTER[0], lng: MAP_CENTER[1] }
const MATCH_RADIUS_M = 120 // an open issue this close counts as a possible duplicate

// The draggable pin is the Map's own "report here" pin (pinMarkup.js), inside
// this page's wrapper for the pulse, the shadow and the lift while dragging.
const dragPinIcon = L.divIcon({
  className: 'report-pin',
  html: `<div class="pin-wrap">
    <span class="pin-pulse"></span>
    <span class="pin-shadow"></span>
    <div class="pin-body">${draftPinSvg}</div>
  </div>`,
  iconSize: DRAFT_PIN_SIZE,
  iconAnchor: [DRAFT_PIN_SIZE[0] / 2, DRAFT_PIN_SIZE[1]],
  tooltipAnchor: [0, -DRAFT_PIN_SIZE[1]],
})

// The draft pin's parts. Its animations are the shared ones in index.css.
const pickerStyle = `
  /* the pin: lifts on hover, floats while dragged, bounces when it lands */
  .report-pin { background: transparent; border: 0; }
  .report-pin .pin-wrap { position: relative; width: 100%; height: 100%; }
  .report-pin .pin-body {
    position: absolute;
    inset: 0;
    transform-origin: 50% 100%;
    transition: transform var(--duration-fast) var(--ease-calm);
  }
  .report-pin:hover .pin-body { transform: translateY(-4px); }
  .report-pin.is-dragging .pin-body { transform: translateY(-12px) scale(1.1); }
  .report-pin .pin-body.pin-drop { animation: drop-in var(--duration-slow) var(--ease-spring); }
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
    animation: ring-out 1.8s var(--ease-calm) infinite;
  }
  .report-pin.is-dragging .pin-pulse { display: none; }
`

// Moves the map when the pin is set from search or "Use my location".
function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) flyTo(map, [target.lat, target.lng], target.zoom, { duration: 0.8 })
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
//   initialPlace: { label, ward, division } shown while the pin is still at `initial`.
export default function LocationPicker({
  category,
  onChange,
  onToast,
  initial,
  excludeId,
  showMatches = true,
  initialPlace,
}) {
  const t = useT()
  const [position, setPosition] = useState(() => initial ?? START)
  const [placeName, setPlaceName] = useState('')
  const [found, setFound] = useState(null) // { lat, lng, division } for the last pin we looked up
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
    getIssues()
      .then((list) => {
        if (active) setIssues(list)
      })
      .catch(() => {}) // duplicate check is a bonus; the form still works without it
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
        setFound({
          lat: position.lat,
          lng: position.lng,
          division: divisionFromPlaceName(a.state),
        })
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

  // The division of the pin. Empty while it is still being looked up, or when
  // the lookup failed, so a report is never sent with a guessed division.
  const lookedUp = found && found.lat === position.lat && found.lng === position.lng
  const division = atInitial && initialPlace.division ? initialPlace.division : lookedUp ? found.division : ''

  useEffect(() => {
    onChange?.({ lat: position.lat, lng: position.lng, label, ward, division })
  }, [position.lat, position.lng, label, ward, division, onChange])

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
      // known issues first; if the list fails, go straight to the place search
      const list = await getIssues({ search: q }).catch(() => [])
      const known = list.find((i) => typeof i.lat === 'number')
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
        setMessage('No place found. Try a street or landmark in Bangladesh.')
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
    getIssues()
      .then(setIssues)
      .catch(() => {}) // keep the list we already have
    onToast?.(t('You upvoted "{title}", so there is no need to report it again.', { title: issue.title }))
  }

  function handleDismiss() {
    if (match) setDismissed((list) => [...list, match.issue.id])
  }

  return (
    <section
      aria-label={t('Choose the location')}
      className="relative isolate min-h-[560px] overflow-hidden rounded-card bg-mint shadow-sm transition-shadow duration-300 hover:shadow-xl"
      style={enter('rise-in', 0.2)}
    >
      <style>{pickerStyle}</style>

      <MapContainer
        {...mapMotionOptions()}
        center={markerPosition}
        zoom={16}
        scrollWheelZoom
        zoomControl={false}
        className="absolute inset-0 z-0 h-full w-full"
      >
        {/* The same + and − as the issue page, where Leaflet's own sat. */}
        <MiniMapZoom position="left-3 top-3" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyTo target={flyTarget} />
        <ClickToPlace onPlace={setPosition} />

        {/* Leaflet reads className and interactive only when the layer is
            created, so they are direct props, not pathOptions (which react-leaflet
            applies later with setStyle). */}
        <Circle
          center={markerPosition}
          radius={MATCH_RADIUS_M}
          interactive={false}
          className="stroke-forest fill-forest/10 stroke-2 [stroke-dasharray:6_6]"
        />

        {match && (
          <Marker
            position={[match.issue.lat, match.issue.lng]}
            icon={pinIcon(match.issue.status, true)}
            interactive={false}
          />
        )}

        <Marker
          ref={markerRef}
          position={markerPosition}
          icon={dragPinIcon}
          draggable
          alt={t('Report location pin')}
          title={t('The pin marks where the problem is. Drag it to change the spot.')}
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
            placeholder={t('Search street or landmark')}
            aria-label={t('Search street or landmark')}
            className="w-full rounded-full border border-navy/15 bg-white py-2.5 pl-10 pr-4 font-body text-sm text-navy shadow-sm max-md:min-h-11 transition placeholder:text-muted hover:border-forest/50 focus:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
          />
        </div>
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          className="group shrink-0 rounded-full border border-navy/15 bg-white px-4 py-2.5 font-body text-sm font-semibold text-navy shadow-sm transition hover:-translate-y-0.5 hover:bg-mint hover:shadow-md active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
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
            {locating ? t('Locating…') : t('Use my location')}
          </span>
        </button>
        <span className="sr-only" aria-live="polite">
          {searching ? t('Searching') : ''}
        </span>
      </form>

      {message && (
        <p
          role="status"
          className="absolute left-16 top-16 z-[1000] max-w-xs rounded-xl bg-white px-3 py-2 font-body text-xs font-semibold text-navy shadow"
        >
          {t(message)}
        </p>
      )}

      {/* duplicate match + selected location */}
      <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[1000] flex flex-col items-stretch gap-3 md:flex-row md:items-end md:justify-between">
        {match ? (
          <div
            key={match.issue.id}
            className="pointer-events-auto max-w-sm rounded-2xl border-2 border-amber-dark bg-white p-4 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            style={enter('rise-in', 0, 'var(--duration-base)')}
          >
            <div className="flex items-center gap-2">
              <StaircaseIcon level={1} className="h-5 w-5 text-amber-dark" />
              <h3 className="font-heading text-base font-extrabold text-navy">
                {t('Looks like a match nearby')}
              </h3>
            </div>
            <p className="mt-2 font-body text-sm text-navy">
              {match.issue.title} · {t('{distance} m away', { distance: Math.round(match.distance) })} ·{' '}
              {t('{n} upvotes', { n: match.issue.votes })}. {t('Upvoting tells authorities what matters most.')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleUpvote}
                className="rounded-full bg-forest px-4 py-2 font-body text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-forest/90 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/60 focus-visible:ring-offset-2"
              >
                ↑ {t('Upvote it instead')}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-full border-2 border-amber-dark px-4 py-2 font-body text-sm font-bold text-navy transition hover:-translate-y-0.5 hover:bg-amber/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
              >
                {t('Mine is different')}
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
          <p className="font-body text-xs text-muted">{t('Selected location')}</p>
          <p
            key={label}
            className="font-body text-sm font-bold text-navy"
            style={enter('rise-in', 0, 'var(--duration-base)')}
          >
            {t(label)}
            {ward ? `, ${ward}` : ''}
          </p>
          <p className="font-body text-xs text-muted">
            {division ? t('{division} division', { division: t(division) }) : t('Checking the division…')}
          </p>
        </div>
      </div>
    </section>
  )
}
