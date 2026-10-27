import Reveal from '../../components/ui/Reveal'
import StatCard from './StatCard'
import { useT } from '../../i18n/useLanguage'

export default function StatsRow({ stats }) {
  const t = useT()
  return (
    <section className="relative z-10 -mt-16 px-5 md:px-10 xl:px-18">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Reveal>
          <StatCard value={stats?.received} label={t('Reports filed')} />
        </Reveal>
        <Reveal delay={100}>
          <StatCard value={stats?.resolved} label={t('Resolved and verified')} tone="forest" />
        </Reveal>
        <Reveal delay={200}>
          <StatCard value={stats?.avgDays} decimals={1} unit={t('days')} label={t('Average time to fix')} />
        </Reveal>
        <Reveal delay={300}>
          <StatCard
            value={stats?.reopenedPercent}
            decimals={1}
            suffix="%"
            label={t('Reopened after closing')}
          />
        </Reveal>
      </div>
    </section>
  )
}