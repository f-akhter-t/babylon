import CategoryChip from '../../components/ui/CategoryChip'
import { CATEGORIES } from '../../mock/issues'

const STATUSES = [
  { value: 'All', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
]

export default function FeedFilters({
  category, onCategory, status, onStatus, search, onSearch, loading, resultCount,
}) {
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <span className="ml-auto font-body text-sm text-muted">
          {loading ? 'Searching…' : `${resultCount} ${resultCount === 1 ? 'issue' : 'issues'} found`}
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
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by title or street…"
          className="w-full rounded-full border border-navy/15 bg-white py-2.5 pl-10 pr-4 font-body text-sm text-navy placeholder:text-muted transition focus:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
        />
      </div>

      {/* Category (left) + Status (right) — two separate pills, same width as the card grid below */}
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex max-w-full flex-wrap items-center gap-2 rounded-full bg-white/85 px-4 py-2.5 shadow-sm ring-1 ring-navy/5 backdrop-blur-sm">
          <span className="shrink-0 font-body text-xs font-semibold uppercase tracking-wide text-muted">
            Category
          </span>
          <CategoryChip
            label="All"
            tone="forest"
            active={category === 'All'}
            onClick={() => onCategory('All')}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
          />
          {CATEGORIES.map((c) => (
            <CategoryChip
              key={c}
              label={c}
              tone="forest"
              active={category === c}
              onClick={() => onCategory(c)}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
            />
          ))}
        </div>

        <div className="flex max-w-full flex-wrap items-center gap-2 rounded-full bg-white/85 px-4 py-2.5 shadow-sm ring-1 ring-navy/5 backdrop-blur-sm">
          <span className="shrink-0 font-body text-xs font-semibold uppercase tracking-wide text-muted">
            Status
          </span>
          {STATUSES.map((s) => (
            <CategoryChip
              key={s.value}
              label={s.label}
              active={status === s.value}
              onClick={() => onStatus(s.value)}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
            />
          ))}
        </div>
      </div>
    </>
  )
}