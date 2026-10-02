import StatCard from './StatCard'

export default function StatsRow({ stats }) {
  return (
    <section className="relative z-10 -mt-16 px-18">
      <div className="grid grid-cols-4 gap-4">
        <StatCard value={stats?.received ?? '–'} label="Reports filed" />
        <StatCard value={stats?.resolved ?? '–'} label="Resolved and verified" tone="forest" />
        <StatCard value={stats?.avgDays ?? '–'} unit="days" label="Average time to fix" />
        <StatCard
          value={stats ? `${stats.reopenedPercent}%` : '–'}
          label="Reopened after closing"
        />
      </div>
    </section>
  )
}