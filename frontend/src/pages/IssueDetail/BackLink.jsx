import { Link } from 'react-router-dom'
import { ChevronLeftIcon } from './DetailIcons'
import { useT } from '../../i18n/useLanguage'

// "Back to map" opens the map with this issue selected (?issue=3).
export default function BackLink({ id }) {
  const t = useT()
  return (
    <Link
      to={`/map?issue=${id}`}
      className="inline-flex min-h-11 items-center gap-1 rounded-full pr-2 text-sm font-medium text-slate hover:text-navy hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
    >
      <ChevronLeftIcon size={16} />
      {t('Back to map')}
    </Link>
  )
}
