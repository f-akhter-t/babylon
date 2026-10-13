import { RISE_IN } from '../Map/motion'
import { useEntrance } from './useEntrance'
import BackLink from './BackLink'
import ShareButton from './ShareButton'
import IssuePhoto from './IssuePhoto'
import IssueMiniMap from './IssueMiniMap'
import IssueSummary from './IssueSummary'
import DetailActions from './DetailActions'
import ProgressCard from './ProgressCard'
import SeenBeforeNote from './SeenBeforeNote'
import OwnerEdit from './OwnerEdit'

// The page once the issue has loaded.
// Phones: one column (photo, details, map).
// Desktop: photo and map on the left, the details panel on the right.
// editAccess: 'ok' or 'locked' for the citizen who reported it, else 'not-owner'.
export default function IssueView({ issue, viewer, editAccess, onToggleVote, onToggleFollow }) {
  // The three parts rise in one after the other.
  const photoRef = useEntrance(RISE_IN)
  const detailsRef = useEntrance(RISE_IN, { delay: 120 })
  const mapRef = useEntrance(RISE_IN, { delay: 240 })

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <BackLink id={issue.id} />
        <ShareButton title={issue.title} />
      </div>

      <div className="mt-3 grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:grid-rows-[auto_1fr]">
        <div ref={photoRef} className="min-w-0 lg:col-start-1 lg:row-start-1">
          <IssuePhoto issue={issue} />
        </div>

        <div
          ref={detailsRef}
          className="flex min-w-0 flex-col gap-5 rounded-hero bg-white p-5 shadow-xl shadow-navy/5 sm:p-7 lg:col-start-2 lg:row-span-2 lg:row-start-1"
        >
          <IssueSummary issue={issue} />
          {editAccess !== 'not-owner' && <OwnerEdit issueId={issue.id} access={editAccess} />}
          <DetailActions
            issue={issue}
            viewer={viewer}
            onToggleVote={onToggleVote}
            onToggleFollow={onToggleFollow}
          />
          <ProgressCard issue={issue} />
          {issue.seenBefore && <SeenBeforeNote text={issue.seenBefore} />}
        </div>

        {/* Desktop: the details panel is the longer column, so the map stays
            in view under the sticky navbar while the reader scrolls. */}
        <div
          ref={mapRef}
          className="min-w-0 lg:sticky lg:top-24 lg:col-start-1 lg:row-start-2 lg:self-start"
        >
          <IssueMiniMap issue={issue} />
        </div>
      </div>
    </>
  )
}
