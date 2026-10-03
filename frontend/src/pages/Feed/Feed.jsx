import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import CategoryChip from '../../components/ui/CategoryChip'
import StatusPill from '../../components/ui/StatusPill'
import PriorityBadge from '../../components/ui/PriorityBadge'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import BeforeAfterSlider from './BeforeAfterSlider'
import { getIssues } from '../../services/api'
import { CATEGORIES } from '../../mock/issues'

const STATUSES = [
  { value: 'All', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
]

export default function Feed() {
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('All')
  const [issues, setIssues] = useState([])
  const [votes, setVotes] = useState({})

  useEffect(() => {
    let active = true
    getIssues({ category, status }).then((list) => {
      if (active) setIssues(list)
    })
    return () => {
      active = false
    }
  }, [category, status])

  function handleUpvote(id, baseVotes) {
    setVotes((prev) => {
      const current = prev[id] ?? baseVotes
      return { ...prev, [id]: current + 1 }
    })
  }

  return (
    <>
      <Navbar variant="citizen" />

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

        <section className="mx-auto max-w-6xl px-6 py-8 md:px-10">
          <div className="flex flex-wrap gap-2">
            <CategoryChip
              label="All"
              active={category === 'All'}
              onClick={() => setCategory('All')}
            />
            {CATEGORIES.map((c) => (
              <CategoryChip
                key={c}
                label={c}
                active={category === c}
                onClick={() => setCategory(c)}
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
              />
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {issues.map((issue) => (
              <FeedCard
                key={issue.id}
                issue={issue}
                votes={votes[issue.id] ?? issue.votes}
                onUpvote={() => handleUpvote(issue.id, issue.votes)}
              />
            ))}
          </div>

          {issues.length === 0 && (
            <p className="mt-10 text-center font-body text-muted">
              No issues match these filters yet.
            </p>
          )}
        </section>
      </main>

      <Footer />
    </>
  )
}

function FeedCard({ issue, votes, onUpvote }) {
  const isFixed = issue.status === 'resolved' && issue.afterImg

  return (
    <article className="group overflow-hidden rounded-card bg-mint shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="relative h-40 overflow-hidden bg-slate/20">
        {isFixed ? (
          <BeforeAfterSlider
            before={issue.beforeImg}
            after={issue.afterImg}
            alt={issue.title}
          />
        ) : (
          <>
            <img
              src={issue.beforeImg}
              alt={issue.title}
              className="h-full w-full object-cover transition group-hover:scale-105"
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
          <h3 className="font-heading text-base font-bold text-navy hover:underline">
            {issue.title}
          </h3>
        </Link>
        <p className="font-body text-sm text-muted">{issue.location}</p>

        <div className="mt-1 flex items-center justify-between">
          <StatusPill status={issue.status} />
          {issue.status === 'resolved' ? (
            <span className="flex items-center gap-1 rounded-full bg-mint-deep px-3 py-1.5 font-body text-xs font-semibold text-navy">
              ✓ {votes}
            </span>
          ) : (
            <button
              type="button"
              onClick={onUpvote}
              className="flex items-center gap-1 rounded-full border-2 border-navy px-3 py-1.5 font-body text-xs font-semibold text-navy transition active:scale-95 hover:bg-navy/10"
            >
              ↑ {votes}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}