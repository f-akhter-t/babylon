import { Link } from 'react-router-dom'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import BeforeAfterSlider from './BeforeAfterSlider'

export default function FixedIssueCard({ issue }) {
  const days = issue.fixedInDays

  return (
    <article className="overflow-hidden rounded-card bg-mint">
      <BeforeAfterSlider className="h-40" />

      <div className="p-5">
        <h3 className="min-h-14 font-heading text-xl font-extrabold leading-tight text-navy">
          <Link to={`/issues/${issue.id}`} className="hover:underline">
            {issue.title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-slate">
          {issue.location} · {issue.category}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full bg-mint-deep px-3 py-1 text-sm font-semibold text-navy">
            <StaircaseIcon level={3} className="text-forest" />
            Verified by admin
          </span>
          <span className="text-sm font-semibold text-navy">
            Fixed in {days} {days === 1 ? 'day' : 'days'}
          </span>
        </div>
      </div>
    </article>
  )
}