import { useCallback, useEffect, useRef, useState } from 'react'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import AnimatedBackground from '../../components/ui/AnimatedBackground'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import LoadError from '../../components/ui/LoadError'
import FeedFilters from './FeedFilters'
import FeedGrid from './FeedGrid'
import { useVotes } from '../Map/useVotes'
import { getIssues } from '../../services/api'
import { useLiveIssues } from '../../hooks/useLiveIssues'
import { useHeldList } from '../../hooks/useHeldList'
import NewReportsBar from '../../components/ui/NewReportsBar'
import { prefersLessMotion } from '../../components/ui/motion'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useToast } from '../../components/ui/toast'
import { useViewer } from '../Map/useViewer'
import { useProfile } from '../../hooks/useProfile'
import { useT } from '../../i18n/useLanguage'

const EMPTY = []
const LOAD_FAILED = 'We could not load the issues. Check your connection and try again.'

export default function Feed() {
  const t = useT()
  useDocumentTitle('Issue feed')
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('All')
  const [search, setSearch] = useState('')
  const toast = useToast()

  // A citizen sees only their own division's issues; everyone else sees all of
  // Bangladesh. Their division comes from their profile, so wait for it first.
  const viewer = useViewer()
  const me = useProfile()
  const isCitizen = viewer.role === 'citizen'
  const division = isCitizen ? (me.profile?.division ?? '') : ''
  const waiting = isCitizen && me.loading

  // Live: another tab's new, changed or deleted report shows up here without a
  // reload. New filters load afresh; retry keeps the filters.
  const filterKey = JSON.stringify([category, status, search, division])
  const load = useCallback(
    // A promise that never settles keeps the list on "loading" until the profile is here.
    () => (waiting ? new Promise(() => {}) : getIssues({ category, status, search, division, includeUnlocated: true })),
    [category, status, search, division, waiting],
  )
  const { data, error, loading, retry, update } = useLiveIssues(load, { list: (list) => list })
  const failed = Boolean(error) && !loading
  const issues = loading || failed ? EMPTY : data

  // While someone is using the list it holds still (see useHeldList).
  const gridRef = useRef(null)
  const headingRef = useRef(null)
  const held = useHeldList(issues, { containerRef: gridRef, resetKey: filterKey, update, headingRef })
  // Votes live on the server; a click shows at once, until the next refresh agrees.
  const { withVotes, toggle: toggleVote } = useVotes(held.items)
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

  async function handleUpvote(issue) {
    if (issue.status === 'resolved') return
    try {
      const answer = await toggleVote(issue.id)
      if (answer) toast.info(answer.voted ? 'You upvoted this issue.' : 'Your vote was removed.')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const shownIssues = withVotes(held.items)

  return (
    <>
      <AnimatedBackground photo={false} />
      <Navbar />

      <main>
        <section className="relative isolate overflow-hidden bg-ink px-6 py-16 text-paper md:px-10">
          {/* A real street photo, faded right back so the heading stays easy to read. */}
          <img
            src="/images/login-roundabout.jpg"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 -z-10 size-full object-cover object-[center_42%] opacity-40 saturate-50"
          />
          <div className="absolute inset-0 -z-10 bg-linear-to-r from-ink via-ink/55 to-ink/10" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-16 bg-linear-to-t from-ink/80 to-transparent" />
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-4">
            <StaircaseIcon level={3} className="h-10 w-10 text-brand" />
            <h1 className="font-heading text-4xl font-extrabold md:text-5xl">
              {t('Every fix starts with a pin.')}
            </h1>
            <p className="max-w-xl font-body text-paper/70">
              {t('Browse every issue the city is tracking, from freshly reported to fully resolved. Drag the slider on fixed issues to see the before and after.')}
            </p>
            {division && (
              <p className="font-body text-sm font-semibold text-brand">
                {t('Showing issues in {division} division', { division: t(division) })}
              </p>
            )}
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
              {t('Issues')}
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