import { useEffect, useRef } from 'react'
import { Popup } from 'react-leaflet'
import clsx from 'clsx'
import Button from '../../components/ui/Button'
import StatusPill from '../../components/ui/StatusPill'
import PriorityBadge from '../../components/ui/PriorityBadge'
import { formatDaysAgo } from '../../utils/format'
import { ArrowDownIcon, ArrowUpIcon, BellIcon } from './MapIcons'
import PopupPhoto from './PopupPhoto'
import { POPUP_CLASSES } from './popupStyles'
import { animate, RISE_IN, SPRING } from './motion'

// Shown only while an issue is selected. React decides when it is open,
// so the popup, the pin and the card always agree.
// Votes and follows live in Map.jsx, so the list updates too.
export default function MapPopup({ issue, onClose, onToggleVote, onToggleFollow }) {
  const { voted, votes, followed } = issue
  const contentRef = useRef(null)

  // Grow the white card in from just above the pin when it opens.
  useEffect(() => {
    const card = contentRef.current?.closest('.leaflet-popup-content-wrapper')
    animate(card, RISE_IN, { duration: 320, easing: SPRING })
  }, [])

  return (
    <Popup
      position={[issue.lat, issue.lng]}
      offset={[0, -44]} // sit above the selected pin, not on top of it
      minWidth={310}
      maxWidth={330}
      closeButton={false}
      closeOnClick={false}
      autoClose={false}
      autoPan={false}
      className={POPUP_CLASSES}
    >
      <div ref={contentRef} className="relative flex flex-col gap-3 p-4 font-body text-navy">
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

        <div className="flex gap-2">
          <Button
            onClick={() => onToggleVote(issue.id)}
            // "!" so the red wins over the button's own green background
            className={clsx('flex-1', voted && 'bg-danger! hover:bg-danger/90!')}
          >
            {/* After voting, the same button takes the vote back. */}
            {voted ? <ArrowDownIcon size={16} /> : <ArrowUpIcon size={16} />}
            {voted ? 'Downvote' : 'Upvote'} · {votes}
          </Button>
          <button
            type="button"
            onClick={() => onToggleFollow(issue.id)}
            aria-pressed={followed}
            aria-label={followed ? 'Unfollow this issue' : 'Follow this issue'}
            title={followed ? 'Following: click to unfollow' : 'Follow for status updates'}
            className={clsx(
              'flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-navy transition motion-safe:active:scale-90',
              followed ? 'bg-navy text-brand' : 'text-navy hover:bg-navy/10',
            )}
          >
            <BellIcon size={18} className={clsx(followed && 'fill-current')} />
          </button>
          {/* text-navy! beats Leaflet's blue link colour */}
          <Button variant="outline" to={`/issues/${issue.id}`} className="text-navy!">
            Details
          </Button>
        </div>

        {followed && (
          <span className="-mt-1 text-xs font-medium text-forest">
            Following. You will get alerts when this issue changes.
          </span>
        )}
      </div>
    </Popup>
  )
}
