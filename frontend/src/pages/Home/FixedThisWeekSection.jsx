import clsx from 'clsx'
import Button from '../../components/ui/Button'
import Reveal from '../../components/ui/Reveal'
import SectionHeading from './SectionHeading'
import FixedIssueCard from './FixedIssueCard'
import LogoLoader from '../../components/ui/LogoLoader'
import { ArrowRightIcon } from './HomeIcons'
import { useT } from '../../i18n/useLanguage'

export default function FixedThisWeekSection({ issues }) {
  const t = useT()
  const loading = issues === undefined
  const list = issues ?? []
  const oddCount = list.length % 2 === 1

  return (
    <section className="px-5 pb-20 pt-16 md:px-10 xl:px-18">
      <Reveal>
        <SectionHeading eyebrow={t('Proof, not promises')} title={t('Fixed this week')}>
          <Button variant="outline" to="/feed">
            {t('See all resolved')} <ArrowRightIcon className="size-4" />
          </Button>
        </SectionHeading>
      </Reveal>

      <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading && (
          <LogoLoader label={t('Loading this week’s fixes…')} className="md:col-span-2 xl:col-span-3" />
        )}

        {!loading && list.length === 0 && (
          <p className="text-slate md:col-span-2 xl:col-span-3">
            {t('No issues were closed this week yet.')}
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