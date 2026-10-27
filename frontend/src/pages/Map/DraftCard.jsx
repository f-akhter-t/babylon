import { useState } from 'react'
import { latLng } from 'leaflet'
import Button from '../../components/ui/Button'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import { ArrowUpIcon } from './MapIcons'
import { useT } from '../../i18n/useLanguage'

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
// is close by, otherwise "Report here". PopupShell places and animates it.
export default function DraftCard({ spot, issues, onCancel, onUpvoteInstead }) {
  const t = useT()
  const [dismissed, setDismissed] = useState(false) // "Mine is different"
  const match = dismissed ? null : nearestMatch(spot, issues)

  if (match) {
    const { issue, meters } = match
    return (
      <div className="flex flex-col gap-3 p-4 font-body text-navy">
        <div role="alert" className="flex flex-col gap-1.5 rounded-tile border-2 border-amber-dark bg-amber/20 p-3">
          <span className="flex items-center gap-2 font-heading text-base font-extrabold">
            <StaircaseIcon level={1} className="text-warn" />
            {t('Looks like a match nearby')}
          </span>
          <span className="text-xs leading-relaxed">
            <strong>{issue.title}</strong> · {t('{distance} m away', { distance: Math.round(meters) })} · {t('{n} upvotes', { n: issue.votes })}.{' '}
            {t('Upvoting tells the city what matters most.')}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={() => onUpvoteInstead(issue)}>
            <ArrowUpIcon size={16} />
            {issue.voted ? t('You upvoted it. Show it') : t('Upvote it instead')}
          </Button>
          <Button variant="outline" onClick={() => setDismissed(true)}>
            {t('Mine is different')}
          </Button>
        </div>
      </div>
    )
  }

  const reportLink = `/report?lat=${spot.lat.toFixed(5)}&lng=${spot.lng.toFixed(5)}`

  return (
    <div className="flex flex-col gap-3 p-4 font-body text-navy">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-extrabold leading-tight">
          {t('Report an issue here?')}
        </h2>
        <span className="text-xs text-soft">{t('Drag the pin to adjust the spot.')}</span>
      </div>
      <div className="flex gap-2">
        {/* text-navy! beats Leaflet's blue link colour */}
        <Button to={reportLink} variant="brand" className="flex-1 text-navy!">
          {t('Report here')}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          {t('Cancel')}
        </Button>
      </div>
    </div>
  )
}
