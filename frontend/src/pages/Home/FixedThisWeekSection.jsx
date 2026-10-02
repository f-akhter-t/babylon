import Button from '../../components/ui/Button'
import SectionHeading from './SectionHeading'
import FixedIssueCard from './FixedIssueCard'
import { ArrowRightIcon } from './HomeIcons'

export default function FixedThisWeekSection({ issues }) {
  const oddCount = issues.length % 2 === 1

  return (
    <section className="px-5 pb-20 pt-16 md:px-10 xl:px-18">
      <SectionHeading eyebrow="Proof, not promises" title="Fixed this week">
        <Button variant="outline" to="/feed">
          See all resolved <ArrowRightIcon className="size-4" />
        </Button>
      </SectionHeading>

      <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {issues.map((issue, index) => (
          <FixedIssueCard
            key={issue.id}
            issue={issue}
            className={
              oddCount && index === issues.length - 1 ? 'md:col-span-2 xl:col-span-1' : ''
            }
          />
        ))}
      </div>
    </section>
  )
}