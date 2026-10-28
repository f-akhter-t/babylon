import FeedCard from './FeedCard'
import Reveal from '../../components/ui/Reveal'
import LogoLoader from '../../components/ui/LogoLoader'
import { useT } from '../../i18n/useLanguage'

// isGhost(id): a report removed while the list was in use. It keeps its
// slot, faded out, and cannot be reached (inert) until the list lets go.
// instant: new cards show without an entrance (a change made while the tab
// was hidden).
export default function FeedGrid({ ref, issues, isGhost = () => false, instant = false, loading, onUpvote, onClearFilters }) {
  const t = useT()
  return (
    <>
      <div ref={ref} className="mt-8 grid scroll-mt-24 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading && <LogoLoader label={t('Loading issues…')} className="col-span-full" />}

        {!loading &&
          issues.map((issue, index) => {
            const ghost = isGhost(issue.id)
            return (
              <Reveal
                key={issue.id}
                data-live-id={issue.id}
                index={ghost ? undefined : index}
                instant={instant}
                inert={ghost}
                aria-hidden={ghost || undefined}
                className={ghost ? 'pointer-events-none h-full opacity-0 transition-opacity duration-300' : 'h-full'}
              >
                <FeedCard issue={issue} onUpvote={onUpvote} />
              </Reveal>
            )
          })}
      </div>

      {!loading && issues.length === 0 && (
        <div className="mt-14 flex flex-col items-center gap-2 text-center">
          <span className="text-3xl">🔍</span>
          <p className="font-body text-muted">{t('No issues match these filters yet.')}</p>
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-1 font-body text-sm font-semibold text-accent underline-offset-2 hover:underline"
          >
            {t('Clear filters')}
          </button>
        </div>
      )}
    </>
  )
}