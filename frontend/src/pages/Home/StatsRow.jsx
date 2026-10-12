import Reveal from '../../components/ui/Reveal'
import StatCard from './StatCard'

export default function StatsRow({ stats }) {
  return (
    <section className="relative z-10 -mt-16 px-5 md:px-10 xl:px-18">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Reveal>
          <StatCard value={stats?.received} label="Reports filed" />
        </Reveal>
        <Reveal delay={100}>
          <StatCard value={stats?.resolved} label="Resolved and verified" tone="forest" />
        </Reveal>
        <Reveal delay={200}>
          <StatCard value={stats?.avgDays} decimals={1} unit="days" label="Average time to fix" />
        </Reveal>
        <Reveal delay={300}>
          <StatCard
            value={stats?.reopenedPercent}
            decimals={1}
            suffix="%"
            label="Reopened after closing"
          />
        </Reveal>
      </div>
    </section>
  )
}