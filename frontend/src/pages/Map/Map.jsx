import { useState } from 'react'
import clsx from 'clsx'
import Navbar from '../../components/layout/Navbar'
import IssuesSidebar from './IssuesSidebar'
import IssueMap from './IssueMap'
import { CURSOR_CLASSES, cursorVariables } from './cursors'
import { useMapFilters } from './useMapFilters'
import { useIssues } from './useIssues'
import { useStoredIds } from './useStoredIds'
import { useListKeys } from './useListKeys'
import { useViewer } from './useViewer'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

const NO_FILTERS = { category: 'All', status: 'All', q: '' }

export default function Map() {
  const { category, status, search, selectedId, update } = useMapFilters()
  const { issues, allIssues, loading, error, retry } = useIssues({ category, status, search })
  const viewer = useViewer()
  // Each account has its own votes and follows.
  const [votedIds, toggleVote] = useStoredIds(viewer.storageKey('voted'))
  const [followedIds, toggleFollow] = useStoredIds(viewer.storageKey('followed'))
  const [cursors] = useState(cursorVariables) // built once
  useDocumentTitle('Issues near you') // the same words as the page heading

  // Add this citizen's own vote and follow on top of the data.
  // The order stays as the data gave it (ranking is not done in the page).
  const withMine = (list) =>
    list.map((issue) => {
      const voted = votedIds.includes(issue.id)
      return {
        ...issue,
        votes: issue.votes + (voted ? 1 : 0),
        voted,
        followed: followedIds.includes(issue.id),
      }
    })
  const shownIssues = withMine(issues)

  const select = (id) => update({ issue: id })

  // From the duplicate warning: vote for the existing issue and show it.
  const upvoteInstead = (issue) => {
    if (!issue.voted) toggleVote(issue.id)
    update({ ...NO_FILTERS, issue: issue.id })
  }

  useListKeys(shownIssues, selectedId, select)

  return (
    <div
      style={cursors}
      className={clsx('flex min-h-dvh flex-col font-body lg:h-dvh', CURSOR_CLASSES)}
    >
      {/* With a login, the Navbar uses it. Without one, show the logged-out version. */}
      <Navbar />
      <main className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
        <IssuesSidebar
          className="order-2 lg:order-1"
          issues={shownIssues}
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
    </div>
  )
}
