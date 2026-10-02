import 'leaflet/dist/leaflet.css'
import { useCallback, useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import clsx from 'clsx'
import { MAP_CENTER } from '../../mock/issues'
import PinLayer from './PinLayer'
import FlyToSelected from './FlyToSelected'
import MapPopup from './MapPopup'
import MapControls from './MapControls'
import MapLegend from './MapLegend'
import DropPin from './DropPin'
import Button from '../../components/ui/Button'

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

export default function IssueMap({
  issues,
  allIssues,
  selectedId,
  onSelect,
  onToggleVote,
  onToggleFollow,
  onUpvoteInstead,
  className,
}) {
  // Undefined when nothing is selected, or when a filter hid the selected issue.
  const selected = issues.find((issue) => issue.id === selectedId)
  const [dropping, setDropping] = useState(false) // "drop a pin" mode is on
  const stopDropping = useCallback(() => setDropping(false), [])

  return (
    // isolate keeps Leaflet's own z-index values inside this box.
    <div className={clsx('relative isolate', className)}>
      <MapContainer
        center={MAP_CENTER}
        zoom={14}
        zoomControl={false}
        className="absolute! inset-0 bg-map-land!"
      >
        <TileLayer attribution={ATTRIBUTION} url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <PinLayer issues={issues} selectedId={selectedId} onSelect={onSelect} />

        <FlyToSelected issue={selected} />

        {/* key: a new popup for each issue, so its photo state starts fresh */}
        {selected && (
          <MapPopup
            key={selected.id}
            issue={selected}
            onClose={() => onSelect(null)}
            onToggleVote={onToggleVote}
            onToggleFollow={onToggleFollow}
          />
        )}

        {/* allIssues, not the filtered list: a duplicate is a duplicate
            even if the filters hide it. */}
        <DropPin
          active={dropping}
          issues={allIssues}
          onUpvoteInstead={onUpvoteInstead}
          onPlaced={() => {
            setDropping(false)
            onSelect(null) // close the issue popup so the two don't overlap
          }}
          onStop={stopDropping}
        />

        <MapControls dropping={dropping} onToggleDrop={() => setDropping((on) => !on)} />
      </MapContainer>

      {dropping && (
        <div className="absolute left-1/2 top-20 z-1000 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-navy py-1.5 pl-4 pr-1.5 text-sm font-semibold text-white shadow-xl lg:top-4">
          Click the map to drop a pin
          <button
            type="button"
            onClick={stopDropping}
            className="rounded-full px-3 py-1 text-brand transition-colors hover:bg-white/10"
          >
            Cancel
          </button>
        </div>
      )}

      {/* These sit over the map but outside it, so they don't need Leaflet. */}
      <MapLegend className="absolute bottom-7 left-4 right-4 z-1000 sm:right-auto lg:bottom-4" />

      {/* Phones only: there the navbar hides its Report button inside the menu.
          On desktop the navbar's button is enough. */}
      <Button
        to="/report"
        variant="dark"
        size="lg"
        className="absolute right-4 top-4 z-1000 shadow-xl transition hover:shadow-2xl motion-safe:hover:-translate-y-0.5 lg:hidden"
      >
        <span aria-hidden="true" className="text-xl leading-none text-brand">+</span>
        Report an issue
      </Button>
    </div>
  )
}
