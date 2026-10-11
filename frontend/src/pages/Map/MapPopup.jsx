import StatusPill from '../../components/ui/StatusPill'
import PriorityBadge from '../../components/ui/PriorityBadge'
import { formatDaysAgo } from '../../utils/format'
import PopupPhoto from './PopupPhoto'
import PopupActions from './PopupActions'
import PopupShell from './PopupShell'

const WIDTH = { min: 310, max: 330 }
const PIN_HEIGHT = 50 // the selected pin (see statusPin.js)

// Shown only while an issue is selected. React decides when it is open,
// so the popup, the pin and the card always agree.
// Votes and follows live in Map.jsx, so the list updates too.
// It opens beside the pin (or docked at the bottom on phones), see PopupShell.
export default function MapPopup({ issue, viewer, onClose, onToggleVote, onToggleFollow }) {
  return (
    <PopupShell lat={issue.lat} lng={issue.lng} width={WIDTH} pinHeight={PIN_HEIGHT} waitForFly>
      <div className="relative flex flex-col gap-3 p-4 font-body text-navy">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close (Esc)"
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full text-lg leading-none text-muted hover:bg-mint hover:text-navy"
        >
          ×
        </button>

        <div className="flex gap-3 pr-6">
          <PopupPhoto issue={issue} />
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 className="font-heading text-base font-extrabold leading-tight">{issue.title}</h2>
            <span className="text-xs text-slate">
              {issue.category} · Reported {formatDaysAgo(issue.daysAgo)}
            </span>
            <div className="flex flex-wrap gap-1.5">
              <StatusPill status={issue.status} className="px-2.5 py-0.5 text-xs" />
              <PriorityBadge priority={issue.priority} />
            </div>
          </div>
        </div>

        <PopupActions
          issue={issue}
          viewer={viewer}
          onToggleVote={onToggleVote}
          onToggleFollow={onToggleFollow}
        />
      </div>
    </PopupShell>
  )
}
