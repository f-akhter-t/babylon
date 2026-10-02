import { useEffect, useRef, useState } from 'react'
import { latLng } from 'leaflet'
import Button from '../../components/ui/Button'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import { ArrowUpIcon } from './MapIcons'
import { animate, RISE_IN, SPRING } from './motion'

const MATCH_RADIUS_M = 150

// The closest unresolved issue within 150 m of the new pin, if any.
// Resolved issues are skipped: a fixed problem is not a duplicate.
function nearestMatch(spot, issues) {
  let best = null
  for (const issue of issues) {
    if (issue.status === 'resolved') continue
    const meters = latLng(spot).distanceTo([issue.lat, issue.lng])
    if (meters <= MATCH_RADIUS_M && (!best || meters < best.meters)) best = { issue, meters }
  }
  return best
}

// Popup for the dropped pin: a duplicate warning first if a similar issue
// is close by, otherwise "Report here".
export default function DraftCard({ spot, issues, onCancel, onUpvoteInstead }) {
  const ref = useRef(null)
  const [dismissed, setDismissed] = useState(false) // "Mine is different"
  const match = dismissed ? null : nearestMatch(spot, issues)

  useEffect(() => {
    const card = ref.current?.closest('.leaflet-popup-content-wrapper')
    animate(card, RISE_IN, { duration: 320, easing: SPRING })
  }, [])

  if (match) {
    const { issue, meters } = match
    return (
      <div ref={ref} className="flex flex-col gap-3 p-4 font-body text-navy">
        <div role="alert" className="flex flex-col gap-1.5 rounded-tile border-2 border-amber-dark bg-amber/20 p-3">
          <span className="flex items-center gap-2 font-heading text-base font-extrabold">
            <StaircaseIcon level={1} className="text-amber-dark" />
            Looks like a match nearby
          </span>
          <span className="text-xs leading-relaxed">
            <strong>{issue.title}</strong> · {Math.round(meters)} m away · {issue.votes} upvotes.
            Upvoting tells the city what matters most.
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={() => onUpvoteInstead(issue)}>
            <ArrowUpIcon size={16} />
            {issue.voted ? 'You upvoted it. Show it' : 'Upvote it instead'}
          </Button>
          <Button variant="outline" onClick={() => setDismissed(true)}>
            Mine is different
          </Button>
        </div>
      </div>
    )
  }

  const reportLink = `/report?lat=${spot.lat.toFixed(5)}&lng=${spot.lng.toFixed(5)}`

  return (
    <div ref={ref} className="flex flex-col gap-3 p-4 font-body text-navy">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-extrabold leading-tight">
          Report an issue here?
        </h2>
        <span className="text-xs text-slate">Drag the pin to adjust the spot.</span>
      </div>
      <div className="flex gap-2">
        {/* text-navy! beats Leaflet's blue link colour */}
        <Button to={reportLink} variant="brand" className="flex-1 text-navy!">
          Report here
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
