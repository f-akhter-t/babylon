import Button from '../../components/ui/Button'
import SectionHeading from './SectionHeading'
import FixedIssueCard from './FixedIssueCard'
import { ArrowRightIcon } from './HomeIcons'

export default function FixedThisWeekSection({ issues }) {
  return (
    <section className="px-18 py-20">
      <SectionHeading eyebrow="Proof, not promises" title="Fixed this week">
        <Button variant="outline" to="/feed">
          See all resolved <ArrowRightIcon className="size-4" />
        </Button>
      </SectionHeading>

      <div className="mt-8 grid grid-cols-3 gap-5">
        {issues.map((issue) => (
          <FixedIssueCard key={issue.id} issue={issue} />
        ))}
      </div>
    </section>
  )
}