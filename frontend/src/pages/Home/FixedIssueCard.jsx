import { Link } from 'react-router-dom'
import clsx from 'clsx'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import BeforeAfterSlider from './BeforeAfterSlider'

export default function FixedIssueCard({ issue, className }) {
  const days = issue.fixedInDays

  return (
    <article
      className={clsx(
        'overflow-hidden rounded-card bg-mint transition-[transform,box-shadow] duration-300',
        'hover:-translate-y-1 hover:shadow-xl hover:shadow-navy/15 focus-within:shadow-xl',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        className,
      )}
    >
      <BeforeAfterSlider
        before={issue.beforeImg}
        after={issue.afterImg}
        alt={issue.title}
        className="h-[164px]"
      />

      <div className="p-[22px]">
        <h3 className="min-h-[54px] font-heading text-2xl font-extrabold leading-[1.12] tracking-[-0.015em] text-navy">
          <Link to={`/issues/${issue.id}`} className="hover:underline">
            {issue.title}
          </Link>
        </h3>
        <p className="mt-2.5 text-sm font-medium text-slate">
          {issue.location} · {issue.category}
        </p>

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-full bg-mint-deep px-3.5 text-[13px] font-bold text-forest">
            <StaircaseIcon level={3} className="text-forest" />
            Verified by admin
          </span>
          <span className="whitespace-nowrap text-sm font-bold text-navy">
            Fixed in {days} {days === 1 ? 'day' : 'days'}
          </span>
        </div>
      </div>
    </article>
  )
}