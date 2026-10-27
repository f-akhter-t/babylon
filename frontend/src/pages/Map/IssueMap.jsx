import 'leaflet/dist/leaflet.css'
import { useCallback, useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import clsx from 'clsx'
import { MAP_CENTER } from '../../utils/geo'
import PinLayer from './PinLayer'
import FlyToSelected from './FlyToSelected'
import MapPopup from './MapPopup'
import MapControls from './MapControls'
import MapOverlays from './MapOverlays'
import DropPin from './DropPin'
import { mapMotionOptions } from '../../components/ui/motion'

const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

export default function IssueMap({
  issues,
  allIssues,
  selectedId,
  onSelect,
  viewer,
  onToggleVote,
  onToggleFollow,
  onUpvoteInstead,
  className,
}) {
  // Undefined when nothing is selected, or when a filter hid the selected issue.
  const selected = issues.find((issue) => String(issue.id) === selectedId)
  const [dropping, setDropping] = useState(false) // "drop a pin" mode is on
  const [loginPrompt, setLoginPrompt] = useState(false) // "Log in to report" box
  const stopDropping = useCallback(() => setDropping(false), [])
  const closeLoginPrompt = useCallback(() => setLoginPrompt(false), [])

  // Citizens can report; guests are asked to log in; staff accounts can't report.
  let report = 'none'
  if (viewer.canAct) report = 'link'
  else if (viewer.isGuest) report = 'login'

  const toggleDrop = () => {
    if (report === 'link') setDropping((on) => !on)
    else setLoginPrompt(true)
  }

  return (
    // isolate keeps Leaflet's own z-index values inside this box.
    <div className={clsx('relative isolate', className)}>
      <MapContainer
        {...mapMotionOptions()}
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
            viewer={viewer}
            onClose={() => onSelect(null)}
            onToggleVote={onToggleVote}
            onToggleFollow={onToggleFollow}
          />
        )}

        {/* allIssues, not the filtered list: a duplicate is a duplicate
            even if the filters hide it. */}
        <DropPin
          active={dropping && report === 'link'}
          issues={allIssues}
          onUpvoteInstead={onUpvoteInstead}
          onPlaced={() => {
            setDropping(false)
            onSelect(null) // close the issue popup so the two don't overlap
          }}
          onStop={stopDropping}
        />

        <MapControls report={report} dropping={dropping} onToggleDrop={toggleDrop} />
      </MapContainer>

      <MapOverlays
        dropping={dropping}
        onStopDropping={stopDropping}
        report={report}
        showLoginPrompt={loginPrompt}
        onOpenLoginPrompt={() => setLoginPrompt(true)}
        onCloseLoginPrompt={closeLoginPrompt}
      />
    </div>
  )
}
