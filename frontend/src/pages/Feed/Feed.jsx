import { useCallback, useEffect, useRef, useState } from 'react'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import AnimatedBackground from '../../components/ui/AnimatedBackground'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import LoadError from '../../components/ui/LoadError'
import FeedFilters from './FeedFilters'
import FeedGrid from './FeedGrid'
import { useViewer } from '../Map/useViewer'
import { useStoredIds } from '../Map/useStoredIds'
import { getIssues } from '../../services/api'
import { useLiveIssues } from '../../hooks/useLiveIssues'
import { useHeldList } from '../../hooks/useHeldList'
import NewReportsBar from '../../components/ui/NewReportsBar'
import { prefersLessMotion } from '../../components/ui/motion'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useToast } from '../../components/ui/toast'

const EMPTY = []
const LOAD_FAILED = 'We could not load the issues. Check your connection and try again.'

export default function Feed() {
  useDocumentTitle('Issue feed')
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('All')
  const [search, setSearch] = useState('')
  const toast = useToast()

  const viewer = useViewer()
  // Same key as Map and Issue detail, so a vote shows the same everywhere.
  const [votedIds, toggleVote] = useStoredIds(viewer.storageKey('voted'))

  // Live: another tab's new, changed or deleted report shows up here without a
  // reload. New filters load afresh; retry keeps the filters.
  const filterKey = JSON.stringify([category, status, search])
  const load = useCallback(() => getIssues({ category, status, search, includeUnlocated: true }), [category, status, search])
  const { data, error, loading, retry, update } = useLiveIssues(load, { list: (list) => list })
  const failed = Boolean(error) && !loading
  const issues = loading || failed ? EMPTY : data

  // While someone is using the list it holds still (see useHeldList).
  const gridRef = useRef(null)
  const headingRef = useRef(null)
  const held = useHeldList(issues, { containerRef: gridRef, resetKey: filterKey, update, headingRef })
  const focusNew = useRef(null) // the first new report, after "Show new reports"

  function showNew() {
    focusNew.current = held.showNew()[0] ?? null
  }

  // After "Show new reports": back to the top of the list, and focus on the
  // first new report, so focus is not lost when the button goes. If that
  // report ranks too low to be seen from the top, it is scrolled into view
  // instead, so focus is never off screen.
  useEffect(() => {
    const id = focusNew.current
    const grid = gridRef.current
    if (!id || !grid) return
    focusNew.current = null
    const card = grid.querySelector(`[data-live-id="${CSS.escape(id)}"]`)
    if (!card) return
    const behavior = prefersLessMotion() ? 'instant' : 'smooth'
    const fits = card.getBoundingClientRect().bottom - grid.getBoundingClientRect().top <= window.innerHeight - 96
    if (fits) grid.scrollIntoView({ block: 'start', behavior })
    else card.scrollIntoView({ block: 'center', behavior })
    card.querySelector('a[href]')?.focus({ preventScroll: true })
  })

  function handleUpvote(issue) {
    if (issue.status === 'resolved') return
    const wasVoted = votedIds.includes(issue.id)
    toggleVote(issue.id)
    toast.info(wasVoted ? 'Your vote was removed.' : 'You upvoted this issue.')
  }

  // Overlay this viewer's own vote on top of the fetched count — same math as Map.
  const shownIssues = held.items.map((issue) => {
    const voted = votedIds.includes(issue.id)
    return { ...issue, votes: issue.votes + (voted ? 1 : 0), voted }
  })

  return (
    <>
      <AnimatedBackground />
      <Navbar />

      <main>
        <section className="bg-navy px-6 py-16 text-white md:px-10">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-4">
            <StaircaseIcon level={3} className="h-10 w-10 text-brand" />
            <h1 className="font-heading text-4xl font-extrabold md:text-5xl">
              Every fix starts with a pin.
            </h1>
            <p className="max-w-xl font-body text-white/70">
              Browse every issue the city is tracking, from freshly reported to fully
              resolved. Drag the slider on fixed issues to see the before and after.
            </p>
          </div>
        </section>

        <section className="relative px-6 pb-8 pt-4 md:px-10 md:pt-5">
          <div className="relative mx-auto max-w-6xl">
            <FeedFilters
              category={category}
              onCategory={setCategory}
              status={status}
              onStatus={setStatus}
              search={search}
              onSearch={setSearch}
              loading={loading}
              resultCount={failed ? null : issues.length}
            />

            <h2 ref={headingRef} tabIndex={-1} className="sr-only">
              Issues
            </h2>
            <p role="status" className="sr-only">
              {held.message}
            </p>
            <NewReportsBar count={held.waiting} onShow={showNew} className="top-20" />
            {failed ? (
              <div className="mt-8">
                <LoadError message={LOAD_FAILED} onRetry={retry} />
              </div>
            ) : (
              <FeedGrid
                ref={gridRef}
                issues={shownIssues}
                isGhost={held.isGhost}
                instant={Boolean(update) && !update.animate}
                loading={loading}
                onUpvote={handleUpvote}
                onClearFilters={() => {
                  setCategory('All')
                  setStatus('All')
                  setSearch('')
                }}
              />
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}