import { useEffect, useRef } from 'react'
import { usePoliteMessage } from '../../hooks/usePoliteMessage'
import Navbar from '../../components/layout/Navbar'
import IssuesSidebar from './IssuesSidebar'
import IssueMap from './IssueMap'
import { useMapFilters } from './useMapFilters'
import { useIssues } from './useIssues'
import { useStoredIds } from './useStoredIds'
import { useVotes } from './useVotes'
import { useToast } from '../../components/ui/toast'
import { useListKeys } from './useListKeys'
import { useViewer } from './useViewer'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

const NO_FILTERS = { category: 'All', status: 'All', q: '' }

export default function Map() {
  const { category, status, search, selectedId, update } = useMapFilters()
  const { issues, allIssues, loading, error, retry, update: liveUpdate, allUpdate } = useIssues({
    category,
    status,
    search,
  })
  const viewer = useViewer()
  const toast = useToast()
  // Votes live on the server; follows stay in this browser, one list per account.
  const { withVotes, toggle: toggleStoredVote } = useVotes([...allIssues, ...issues])
  // This person's own vote in this tab: the sidebar card does not pop for it
  // (the button they pressed already answered). Another tab's vote does pop.
  const ownVote = useRef(null)
  const toggleVote = (id) => {
    ownVote.current = id
    return toggleStoredVote(id).catch((error) => {
      ownVote.current = null
      toast.error(error.message)
    })
  }
  const isOwnVote = (id) => {
    const own = ownVote.current === id
    if (own) ownVote.current = null
    return own
  }
  const [followedIds, toggleFollow] = useStoredIds(viewer.storageKey('followed'))
  useDocumentTitle('Issues near you') // the same words as the page heading

  // Add this citizen's own vote and follow on top of the data.
  // The order stays as the data gave it (ranking is not done in the page).
  const withMine = (list) =>
    withVotes(list).map((issue) => ({ ...issue, followed: followedIds.includes(issue.id) }))
  const shownIssues = withMine(issues)

  const select = (id) => update({ issue: id })

  // From the duplicate warning: vote for the existing issue and show it.
  const upvoteInstead = (issue) => {
    if (!issue.voted) toggleVote(issue.id)
    update({ ...NO_FILTERS, issue: issue.id })
  }

  useListKeys(shownIssues, selectedId, select)

  // The report in the open popup was deleted in another tab: close the popup
  // and say so (politely).
  const [spoken, say] = usePoliteMessage()
  const deletedOpen = Boolean(selectedId) && Boolean(allUpdate?.removed.includes(String(selectedId)))
  useEffect(() => {
    if (!deletedOpen) return
    update({ issue: null })
    say('This report was deleted.')
  }, [deletedOpen]) // eslint-disable-line react-hooks/exhaustive-deps -- update is a new function each render

  return (
    <div className="flex min-h-dvh flex-col font-body lg:h-dvh">
      {/* With a login, the Navbar uses it. Without one, show the logged-out version. */}
      <Navbar />
      <main className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
        <IssuesSidebar
          className="order-2 lg:order-1"
          issues={issues}
          withMine={withMine}
          loading={loading}
          error={error}
          category={category}
          onCategory={(value) => update({ category: value })}
          status={status}
          onStatus={(value) => update({ status: value })}
          search={search}
          onSearch={(value) => update({ q: value })}
          selectedId={selectedId}
          onSelect={select}
          onRetry={retry}
          update={liveUpdate}
          isOwnVote={isOwnVote}
          onClearFilters={() => update(NO_FILTERS)}
        />
        <IssueMap
          className="order-1 h-[60vh] lg:order-2 lg:h-auto lg:flex-1"
          issues={shownIssues}
          allIssues={withMine(allIssues)}
          selectedId={selectedId}
          onSelect={select}
          viewer={viewer}
          onToggleVote={toggleVote}
          onToggleFollow={toggleFollow}
          onUpvoteInstead={upvoteInstead}
        />
      </main>
      <p role="status" className="sr-only">
        {spoken}
      </p>
    </div>
  )
}
