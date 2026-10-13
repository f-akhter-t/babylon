import clsx from 'clsx'
import Button from '../../components/ui/Button'
import Reveal from '../../components/ui/Reveal'
import SectionHeading from './SectionHeading'
import FixedIssueCard from './FixedIssueCard'
import FixedIssueSkeleton from './FixedIssueSkeleton'
import { ArrowRightIcon } from './HomeIcons'

export default function FixedThisWeekSection({ issues }) {
  const loading = issues === undefined
  const list = issues ?? []
  const oddCount = list.length % 2 === 1

  return (
    <section className="px-5 pb-20 pt-16 md:px-10 xl:px-18">
      <Reveal>
        <SectionHeading eyebrow="Proof, not promises" title="Fixed this week">
          <Button variant="outline" to="/feed">
            See all resolved <ArrowRightIcon className="size-4" />
          </Button>
        </SectionHeading>
      </Reveal>

      <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading &&
          [0, 1, 2].map((n) => <FixedIssueSkeleton key={n} />)}

        {!loading && list.length === 0 && (
          <p className="text-slate md:col-span-2 xl:col-span-3">
            No issues were closed this week yet.
          </p>
        )}

        {
          list.map((issue, index) => (
            <Reveal key={issue.id} delay={(index % 3) * 100} className="h-full">
              <FixedIssueCard
                issue={issue}
                className={clsx(
                  'h-full',
                  oddCount && index === list.length - 1 && 'md:col-span-2 xl:col-span-1',
                )}
              />
            </Reveal>
          ))
        }
      </div>
    </section>
  )
}