import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import CategoryChip from '../../components/ui/CategoryChip'
import StatusPill from '../../components/ui/StatusPill'
import PriorityBadge from '../../components/ui/PriorityBadge'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import AnimatedBackground from '../../components/ui/AnimatedBackground'
import BeforeAfterSlider from './BeforeAfterSlider'
import { getIssues } from '../../services/api'
import { CATEGORIES } from '../../mock/issues'

const STATUSES = [
  { value: 'All', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
]

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

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = () => setReduced(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

function useInView() {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, inView]
}

export default function Feed() {
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('All')
  const [search, setSearch] = useState('')
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [localVotes, setLocalVotes] = useState({})
  const [bumpingId, setBumpingId] = useState(null)
  const [toast, setToast] = useState(null)
  const reducedMotion = usePrefersReducedMotion()

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

  // unlimited upvotes — only resolved issues stop accepting votes
  function handleUpvote(issue) {
    setLocalVotes((prev) => ({ ...prev, [issue.id]: (prev[issue.id] ?? issue.votes) + 1 }))
    setBumpingId(issue.id)
    setToast('Upvoted')
    setTimeout(() => setBumpingId((cur) => (cur === issue.id ? null : cur)), 300)
  }

  return (
    <>
      <style>{pageStyle}</style>
      <AnimatedBackground />
      <Navbar variant="citizen" />

      <main>
        {/* HERO — back to the original, plain navy */}
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

        {/* LISTING — background now handled by AnimatedBackground */}
        <section className="relative px-6 py-8 md:px-10">
          <div className="relative mx-auto max-w-6xl">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-forest/10 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-forest" />
                </span>
                <span className="font-body text-xs font-semibold text-navy">
                  Live feed 
                </span>
              </div>
              <span className="font-body text-sm text-muted">
                {loading ? 'Searching…' : `${issues.length} ${issues.length === 1 ? 'issue' : 'issues'} found`}
              </span>
            </div>

            <label htmlFor="feed-search" className="sr-only">
              Search issues by title or location
            </label>
            <div className="relative mb-5 max-w-md">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                id="feed-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or street…"
                className="w-full rounded-full border border-navy/15 bg-white py-2.5 pl-10 pr-4 font-body text-sm text-navy placeholder:text-muted transition focus:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <CategoryChip
                label="All"
                active={category === 'All'}
                onClick={() => setCategory('All')}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
              />
              {CATEGORIES.map((c) => (
                <CategoryChip
                  key={c}
                  label={c}
                  active={category === c}
                  onClick={() => setCategory(c)}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
                />
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <CategoryChip
                  key={s.value}
                  label={s.label}
                  tone="forest"
                  active={status === s.value}
                  onClick={() => setStatus(s.value)}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
                />
              ))}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

              {!loading &&
                issues.map((issue, index) => (
                  <FadeUpCard key={issue.id} index={index} reducedMotion={reducedMotion}>
                    <FeedCard
                      issue={issue}
                      votes={localVotes[issue.id] ?? issue.votes}
                      bumping={bumpingId === issue.id}
                      onUpvote={() => handleUpvote(issue)}
                    />
                  </FadeUpCard>
                ))}
            </div>

            {!loading && issues.length === 0 && (
              <div className="mt-14 flex flex-col items-center gap-2 text-center">
                <span className="text-3xl">🔍</span>
                <p className="font-body text-muted">No issues match these filters yet.</p>
                <button
                  type="button"
                  onClick={() => {
                    setCategory('All')
                    setStatus('All')
                    setSearch('')
                  }}
                  className="mt-1 font-body text-sm font-semibold text-forest underline-offset-2 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
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

function FadeUpCard({ children, index, reducedMotion }) {
  const [ref, inView] = useInView()
  return (
    <div
      ref={ref}
      style={{
        opacity: reducedMotion ? 1 : inView ? undefined : 0,
        animation:
          !reducedMotion && inView ? `cardIn 0.45s ease-out ${index * 0.06}s both` : undefined,
      }}
    >
      {children}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-card bg-mint/60">
      <div className="h-40 animate-pulse bg-slate/20" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate/20" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate/20" />
        <div className="mt-3 h-6 w-full animate-pulse rounded-full bg-slate/10" />
      </div>
    </div>
  )
}

function FeedCard({ issue, votes, onUpvote, bumping }) {
  const isFixed = issue.status === 'resolved' && issue.afterImg

  return (
    <article className="group overflow-hidden rounded-card border border-navy/5 bg-mint shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
      <div className="relative h-40 overflow-hidden bg-slate/20">
        {isFixed ? (
          <BeforeAfterSlider before={issue.beforeImg} after={issue.afterImg} alt={issue.title} />
        ) : (
          <>
            <img
              src={issue.beforeImg}
              alt={issue.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextSibling.style.display = 'flex'
              }}
            />
            <div className="hidden h-full w-full items-center justify-center font-body text-xs text-slate">
              Photo not available
            </div>
          </>
        )}
        <span className="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-navy font-body text-xs font-bold text-white">
          {issue.rank}
        </span>
        <PriorityBadge priority={issue.priority} className="absolute right-3 top-3 z-10" />
      </div>

      <div className="flex flex-col gap-3 p-4">
        <Link to={`/issues/${issue.id}`}>
          <h3 className="font-heading text-base font-bold text-navy transition-colors group-hover:text-forest">
            {issue.title}
          </h3>
        </Link>
        <p className="font-body text-sm text-muted">{issue.location}</p>

        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <StatusPill status={issue.status} />
            {issue.status !== 'resolved' && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-dark" />
              </span>
            )}
          </div>

          {issue.status === 'resolved' ? (
            <span className="flex items-center gap-1 rounded-full bg-mint-deep px-3 py-1.5 font-body text-xs font-semibold text-navy">
              ✓ {votes}
            </span>
          ) : (
            <button
              type="button"
              onClick={onUpvote}
              aria-label={`Upvote ${issue.title}, currently ${votes} votes`}
              className="flex items-center gap-1 rounded-full border-2 border-navy px-3 py-1.5 font-body text-xs font-semibold text-navy transition active:scale-95 hover:bg-navy/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
            >
              ↑{' '}
              <span
                style={bumping ? { display: 'inline-block', animation: 'voteBump 0.3s ease-out' } : undefined}
              >
                {votes}
              </span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}