import clsx from 'clsx'
import { enter } from './motion'
import { useT } from '../../i18n/useLanguage'

// "Show 3 new reports": new reports wait behind this while someone is using
// a live list (see hooks/useHeldList.js). It sticks below the navbar, so it
// stays in reach when the list is scrolled, and it takes no height of its
// own, so it never pushes the list down.
//   <NewReportsBar count={held.waiting} onShow={showNew} className="top-20" />
export default function NewReportsBar({ count, onShow, className }) {
  const t = useT()
  if (!count) return null
  return (
    <div className={clsx('sticky z-20 h-0', className)}>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onShow}
          style={enter('rise-in', 0, 'var(--duration-base)')}
          className="press min-h-11 rounded-full bg-navy px-5 font-body text-sm font-bold text-mint shadow-lg"
        >
          {count === 1 ? t('Show 1 new report') : t('Show {count} new reports', { count })}
        </button>
      </div>
    </div>
  )
}
