import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import { canEditIssue } from '../../services/api'
import { useViewer } from '../Map/useViewer'
import { useStoredIds } from '../Map/useStoredIds'
import { useVotes } from '../Map/useVotes'
import { useToast } from '../../components/ui/toast'
import { useIssue } from './useIssue'
import { usePoliteMessage } from '../../hooks/usePoliteMessage'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { DetailLoading, DetailMessage } from './DetailStates'
import PageBackdrop from './PageBackdrop'
import IssueView from './IssueView'
import { clearIssueNotice, peekIssueNotice } from './issueNotice'
import { useT } from '../../i18n/useLanguage'

// Status words for the live announcement, as the progress card shows them.
const STATUS_WORDS = { open: 'Open', 'in-progress': 'In progress', resolved: 'Resolved' }
// A burst of changes from another tab settles before it is announced.
const SETTLE_MS = 400

export default function IssueDetail() {
  const t = useT()
  const { id } = useParams()
  const { issue, loading, error, update, deleted } = useIssue(id)
  const viewer = useViewer()
  // A message from the Edit page ("Your changes are saved."), shown once.
  const [notice] = useState(() => ({ id, message: peekIssueNotice(id) }))
  useEffect(() => clearIssueNotice(notice.id), [notice.id])
  const noticeText = notice.id === id ? notice.message : null
  const toast = useToast()
  // Follows stay in this browser (one list per account); votes live on the server.
  const [followedIds, toggleFollow] = useStoredIds(viewer.storageKey('followed'))
  const { withVotes, toggle } = useVotes(issue ? [issue] : [])
  const toggleVote = (voteId) => toggle(voteId).catch((error) => toast.error(error.message))
  const shown = issue && { ...withVotes([issue])[0], followed: followedIds.includes(issue.id) }

  let tabTitle = null // keep the old tab title while loading
  if (shown) tabTitle = shown.title
  else if (deleted) tabTitle = 'Report deleted'
  else if (!loading) tabTitle = error ? 'Could not load issue' : 'Issue not found'

  // Another tab moved the report on: say its new status, politely. A burst of
  // changes is said once, with the final status.
  const [spoken, say] = usePoliteMessage()
  const lastStatus = useRef(null)
  const settleTimer = useRef(0)
  const status = issue?.status
  useEffect(() => {
    const before = lastStatus.current
    lastStatus.current = status
    if (!status || !before || before === status || !update?.remote) return
    clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => say(t('This report is now {status}.', { status: STATUS_WORDS[status] ?? status })), SETTLE_MS)
  }, [status, update, say, t])
  useEffect(() => () => clearTimeout(settleTimer.current), [])
  useEffect(() => {
    lastStatus.current = null // a new id starts fresh
  }, [id])
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
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-5 sm:px-6 lg:px-10">
        {/* Always in the page, so the message is announced once when it appears. */}
        <div role="status">
          {showNotice && (
            <p className="mb-4 rounded-tile bg-mint px-4 py-3 text-sm font-semibold text-navy shadow-sm">
              {t(noticeText)}
            </p>
          )}
          <span className="sr-only">{spoken}</span>
        </div>
        {loading && <DetailLoading />}
        {!loading && !shown && <DetailMessage error={error} deleted={deleted} />}

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
