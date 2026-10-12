import { useEffect, useState } from 'react'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import AnimatedBackground from '../../components/ui/AnimatedBackground'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import FeedFilters from './FeedFilters'
import FeedGrid from './FeedGrid'
import { useViewer } from '../Map/useViewer'
import { useStoredIds } from '../Map/useStoredIds'
import { getIssues } from '../../services/api'

const pageStyle = `
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes voteBump {
    0% { transform: scale(1); }
    40% { transform: scale(1.35); }
    100% { transform: scale(1); }
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; }
  }
`

export default function Feed() {
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('All')
  const [search, setSearch] = useState('')
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const viewer = useViewer()
  // Same key as Map and Issue detail, so a vote shows the same everywhere.
  const [votedIds, toggleVote] = useStoredIds(viewer.storageKey('voted'))

  useEffect(() => {
    let active = true
    setLoading(true)
    getIssues({ category, status, search }).then((list) => {
      if (active) {
        setIssues(list)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [category, status, search])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 1800)
    return () => clearTimeout(t)
  }, [toast])

  function handleUpvote(issue) {
    if (issue.status === 'resolved') return
    const wasVoted = votedIds.includes(issue.id)
    toggleVote(issue.id)
    setToast(wasVoted ? 'Vote removed' : 'Upvoted')
  }

  // Overlay this viewer's own vote on top of the fetched count — same math as Map.
  const shownIssues = issues.map((issue) => {
    const voted = votedIds.includes(issue.id)
    return { ...issue, votes: issue.votes + (voted ? 1 : 0), voted }
  })

  return (
    <>
      <style>{pageStyle}</style>
      <AnimatedBackground />
      <Navbar variant={viewer.session ? viewer.role : 'logged-out'} />

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
              resultCount={issues.length}
            />

            <FeedGrid
              issues={shownIssues}
              loading={loading}
              onUpvote={handleUpvote}
              onClearFilters={() => {
                setCategory('All')
                setStatus('All')
                setSearch('')
              }}
            />
          </div>
        </section>
      </main>

      <Footer />

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[1200] -translate-x-1/2 rounded-full bg-navy px-5 py-2.5 font-body text-sm font-semibold text-white shadow-lg"
          style={{ animation: 'toastIn 0.25s ease-out' }}
        >
          {toast}
        </div>
      )}
    </>
  )
}