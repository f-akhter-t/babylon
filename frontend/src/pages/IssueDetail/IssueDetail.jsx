import { useParams } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { useViewer } from '../Map/useViewer'
import { useStoredIds } from '../Map/useStoredIds'
import { useUnreadCount } from '../Map/useUnreadCount'
import { useIssue } from './useIssue'
import { useDocumentTitle } from './useDocumentTitle'
import { DetailLoading, DetailMessage } from './DetailStates'
import PageBackdrop from './PageBackdrop'
import IssueView from './IssueView'

export default function IssueDetail() {
  const { id } = useParams()
  const { issue, loading, error } = useIssue(id)
  const viewer = useViewer()
  // The same per-account lists as the Map page, so votes and follows match.
  const [votedIds, toggleVote] = useStoredIds(viewer.storageKey('voted'))
  const [followedIds, toggleFollow] = useStoredIds(viewer.storageKey('followed'))
  // Following an issue adds 1 to the navbar bell, like on the Map page.
  const unread = useUnreadCount(viewer.canAct ? followedIds.length : 0)

  // Add this citizen's own vote and follow on top of the data.
  const voted = issue ? votedIds.includes(issue.id) : false
  const shown = issue && {
    ...issue,
    votes: issue.votes + (voted ? 1 : 0),
    voted,
    followed: followedIds.includes(issue.id),
  }

  let tabTitle = null // keep the old tab title while loading
  if (shown) tabTitle = shown.title
  else if (!loading) tabTitle = error ? 'Could not load issue' : 'Issue not found'
  useDocumentTitle(tabTitle)

  return (
    // isolate: the backdrop's -z-10 stays inside this page.
    <div className="relative isolate min-h-dvh font-body">
      <PageBackdrop />
      <Navbar variant={viewer.session ? viewer.role : 'logged-out'} unread={unread} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-5 sm:px-6 lg:px-10">
        {loading && <DetailLoading />}
        {!loading && !shown && <DetailMessage error={error} />}

        {/* key: a new id starts fresh (photo, map position, animations) */}
        {shown && (
          <IssueView
            key={shown.id}
            issue={shown}
            viewer={viewer}
            onToggleVote={toggleVote}
            onToggleFollow={toggleFollow}
          />
        )}
      </main>
    </div>
  )
}
