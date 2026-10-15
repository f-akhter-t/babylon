import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { canEditIssue } from '../../services/api'
import { useViewer } from '../Map/useViewer'
import { useStoredIds } from '../Map/useStoredIds'
import { useUnreadCount } from '../Map/useUnreadCount'
import { useIssue } from './useIssue'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { DetailLoading, DetailMessage } from './DetailStates'
import PageBackdrop from './PageBackdrop'
import IssueView from './IssueView'
import { clearIssueNotice, peekIssueNotice } from './issueNotice'

export default function IssueDetail() {
  const { id } = useParams()
  const { issue, loading, error } = useIssue(id)
  const viewer = useViewer()
  // A message from the Edit page ("Your changes are saved."), shown once.
  const [notice] = useState(() => ({ id, message: peekIssueNotice(id) }))
  useEffect(() => clearIssueNotice(notice.id), [notice.id])
  const noticeText = notice.id === id ? notice.message : null
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

  // The reporter may edit while the issue is Open ('ok'), or sees why not ('locked').
  const editAccess = shown && viewer.canAct ? canEditIssue(shown, viewer.session.email) : 'not-owner'

  // After a notice, move focus to the issue title so reading starts there.
  const showNotice = Boolean(shown && noticeText)
  useEffect(() => {
    if (showNotice) document.getElementById('issue-title')?.focus()
  }, [showNotice])

  return (
    // isolate: the backdrop's -z-10 stays inside this page.
    <div className="relative isolate min-h-dvh font-body">
      <PageBackdrop />
      <Navbar variant={viewer.session ? viewer.role : 'logged-out'} unread={unread} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-5 sm:px-6 lg:px-10">
        {/* Always in the page, so the message is announced once when it appears. */}
        <div role="status">
          {showNotice && (
            <p className="mb-4 rounded-tile bg-mint px-4 py-3 text-sm font-semibold text-navy shadow-sm">
              {noticeText}
            </p>
          )}
        </div>
        {loading && <DetailLoading />}
        {!loading && !shown && <DetailMessage error={error} />}

        {/* key: a new id starts fresh (photo, map position, animations) */}
        {shown && (
          <IssueView
            key={shown.id}
            issue={shown}
            viewer={viewer}
            editAccess={editAccess}
            onToggleVote={toggleVote}
            onToggleFollow={toggleFollow}
          />
        )}
      </main>
    </div>
  )
}
