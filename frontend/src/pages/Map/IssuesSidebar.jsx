import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import { CATEGORIES } from '../../mock/issues'
import SearchBox from './SearchBox'
import IssueCard from './IssueCard'
import NewReportsBar from '../../components/ui/NewReportsBar'
import { useHeldList } from '../../hooks/useHeldList'
import { prefersLessMotion } from '../../components/ui/motion'
import FilterRow from './FilterRow'
import { StateMessage } from './ListStates'
import LogoLoader from '../../components/ui/LogoLoader'
import { useT } from '../../i18n/useLanguage'

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
  update,
  withMine = (list) => list,
  isOwnVote,
  className,
}) {
  const t = useT()
  const ready = !loading && !error

  // The list holds still while someone uses it (see useHeldList). On wide
  // screens it scrolls in its own box; on phones the page scrolls.
  const listRef = useRef(null)
  const headingRef = useRef(null)
  const held = useHeldList(issues, {
    containerRef: listRef,
    scrollerRef: listRef,
    resetKey: JSON.stringify([category, status, search]),
    update,
    headingRef,
  })
  const focusNew = useRef(null)
  useEffect(() => {
    const id = focusNew.current
    if (!id) return
    focusNew.current = null
    const box = listRef.current
    const card = box?.querySelector(`[data-live-id="${CSS.escape(id)}"]`)
    if (!card) return
    const behavior = prefersLessMotion() ? 'instant' : 'smooth'
    if (box.scrollHeight > box.clientHeight + 1) box.scrollTo({ top: 0, behavior })
    else box.scrollIntoView({ block: 'start', behavior })
    card.scrollIntoView({ block: 'nearest', behavior })
    card.querySelector('button')?.focus({ preventScroll: true })
  })

  let list
  if (error) {
    list = (
      <StateMessage
        role="alert"
        title={t('Could not load issues')}
        text={t('Something went wrong on our side. Please try again.')}
        actionLabel={t('Try again')}
        onAction={onRetry}
      />
    )
  } else if (loading) {
    list = <LogoLoader label={t('Loading issues…')} compact />
  } else if (issues.length === 0) {
    list = (
      <StateMessage
        title={t('Nothing matches')}
        text={t('Try another street, category or status, or see every issue near you.')}
        actionLabel={t('Clear filters')}
        onAction={onClearFilters}
      />
    )
  } else {
    list = withMine(held.items).map((issue) => (
      <IssueCard
        key={issue.id}
        issue={issue}
        ghost={held.isGhost(issue.id)}
        selected={issue.id === selectedId}
        onSelect={onSelect}
        isOwnVote={isOwnVote}
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
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-heading text-3xl font-extrabold tracking-tight text-navy focus:outline-none"
        >
          {t('Issues near you')}
        </h1>
        <span className="pt-2 text-sm font-medium text-slate">{t('By priority')}</span>
      </div>

      <SearchBox value={search} onChange={onSearch} />

      <FilterRow label={t('Category')} options={CATEGORY_OPTIONS} value={category} onChange={onCategory} />
      <FilterRow
        label={t('Status')}
        tone="forest"
        options={STATUS_OPTIONS}
        value={status}
        onChange={onStatus}
      />

      {/* aria-live: screen readers hear the new count when filters change */}
      <span aria-live="polite" className="-mb-1 text-sm font-medium text-slate">
        {ready && (issues.length === 1 ? t('1 issue') : t('{count} issues', { count: issues.length }))}
      </span>

      <p role="status" className="sr-only">
        {held.message}
      </p>
      <div
        ref={listRef}
        className="relative -mx-1 flex scroll-mt-24 flex-col gap-3 px-1 pb-1 lg:flex-1 lg:overflow-y-auto"
      >
        <NewReportsBar
          count={ready ? held.waiting : 0}
          onShow={() => {
            focusNew.current = held.showNew()[0] ?? null
          }}
          className="top-20 lg:top-0"
        />
        {list}
      </div>
    </aside>
  )
}
