import clsx from 'clsx'
import { pinHtml } from '../../pages/Map/pinMarkup'

// A still street map of one spot, built from the same OpenStreetMap tiles the
// Map page uses, with the Map page's pin. No map library: just the few 256px
// tiles that cover the box, placed so the spot is in the middle.
//   lat, lng: the spot (missing = just the background and the pin)
//   status:   'open' | 'in-progress' | 'resolved', the pin's colour
//   cover:    the largest size this box can be, so enough tiles are placed
// Decorative: hidden from screen readers, never focusable or clickable.
// A tile shows only once it has loaded, so a failed one (offline) leaves the
// plain background: never a broken-image icon.

const ZOOM = 17 // street level
const TILE = 256
const PIN = { width: 30, height: 38 } // the Map page's pin (statusPin.js)

// The spot in world pixels at ZOOM (Web Mercator, like Leaflet).
function worldPixels(lat, lng) {
  const scale = TILE * 2 ** ZOOM
  const sin = Math.sin((lat * Math.PI) / 180)
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  }
}

function tilesAround(lat, lng, cover) {
  const { x, y } = worldPixels(lat, lng)
  const tiles = []
  const firstX = Math.floor((x - cover.width / 2) / TILE)
  const lastX = Math.floor((x + cover.width / 2) / TILE)
  const firstY = Math.floor((y - cover.height / 2) / TILE)
  const lastY = Math.floor((y + cover.height / 2) / TILE)
  for (let ty = firstY; ty <= lastY; ty++) {
    for (let tx = firstX; tx <= lastX; tx++) {
      // Offset of the tile's top-left corner from the spot.
      tiles.push({ key: `${tx}-${ty}`, tx, ty, left: tx * TILE - x, top: ty * TILE - y })
    }
  }
  return tiles
}

const showTile = (event) => {
  event.currentTarget.style.opacity = '1'
}

export default function StaticMap({ lat, lng, status = 'open', cover = { width: 260, height: 150 }, className }) {
  const hasSpot = Number.isFinite(lat) && Number.isFinite(lng)
  const tiles = hasSpot ? tilesAround(lat, lng, cover) : []

  return (
    <div
      aria-hidden="true"
      className={clsx('pointer-events-none relative overflow-hidden bg-map-land', className)}
    >
      {tiles.map((tile) => (
        <img
          key={tile.key}
          src={`https://tile.openstreetmap.org/${ZOOM}/${tile.tx}/${tile.ty}.png`}
          alt=""
          width={TILE}
          height={TILE}
          loading="lazy"
          decoding="async"
          draggable="false"
          onLoad={showTile}
          className="absolute max-w-none opacity-0"
          style={{ left: `calc(50% + ${tile.left}px)`, top: `calc(50% + ${tile.top}px)` }}
        />
      ))}
      {/* The pin's tip sits on the spot, like the Map page's iconAnchor. */}
      <div
        className="absolute"
        style={{
          width: PIN.width,
          height: PIN.height,
          left: `calc(50% - ${PIN.width / 2}px)`,
          top: `calc(50% - ${PIN.height}px)`,
        }}
        dangerouslySetInnerHTML={{ __html: pinHtml(status, false) }}
      />
    </div>
  )
}
