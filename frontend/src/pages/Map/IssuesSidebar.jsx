import clsx from 'clsx'
import { CATEGORIES } from '../../mock/issues'
import SearchBox from './SearchBox'
import IssueCard from './IssueCard'
import FilterRow from './FilterRow'
import { SkeletonCards, StateMessage } from './ListStates'

const CATEGORY_OPTIONS = ['All', ...CATEGORIES].map((name) => ({ value: name, label: name }))

const STATUS_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
]

export default function IssuesSidebar({
  issues,
  loading,
  error,
  category,
  onCategory,
  status,
  onStatus,
  search,
  onSearch,
  selectedId,
  onSelect,
  onRetry,
  onClearFilters,
  className,
}) {
  const ready = !loading && !error

  let list
  if (error) {
    list = (
      <StateMessage
        role="alert"
        title="Could not load issues"
        text="Something went wrong on our side. Please try again."
        actionLabel="Try again"
        onAction={onRetry}
      />
    )
  } else if (loading) {
    list = <SkeletonCards />
  } else if (issues.length === 0) {
    list = (
      <StateMessage
        title="Nothing matches"
        text="Try another street, category or status, or see every issue near you."
        actionLabel="Clear filters"
        onAction={onClearFilters}
      />
    )
  } else {
    list = issues.map((issue) => (
      <IssueCard
        key={issue.id}
        issue={issue}
        selected={issue.id === selectedId}
        onSelect={onSelect}
      />
    ))
  }

  return (
    <aside
      className={clsx(
        'flex flex-col gap-4 bg-page px-5 py-6 lg:min-h-0 lg:w-100 lg:shrink-0',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-navy">
          Issues near you
        </h1>
        <span className="pt-2 text-sm font-medium text-slate">By priority</span>
      </div>

      <SearchBox value={search} onChange={onSearch} />

      <FilterRow label="Category" options={CATEGORY_OPTIONS} value={category} onChange={onCategory} />
      <FilterRow
        label="Status"
        tone="forest"
        options={STATUS_OPTIONS}
        value={status}
        onChange={onStatus}
      />

      {/* aria-live: screen readers hear the new count when filters change */}
      <span aria-live="polite" className="-mb-1 text-sm font-medium text-slate">
        {ready && `${issues.length} ${issues.length === 1 ? 'issue' : 'issues'}`}
      </span>

      <div className="relative -mx-1 flex flex-col gap-3 px-1 pb-1 lg:flex-1 lg:overflow-y-auto">
        {list}
      </div>
    </aside>
  )
}
