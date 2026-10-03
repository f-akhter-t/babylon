import StatCard from './StatCard'

export default function StatsRow({ stats }) {
  return (
    <section className="relative z-10 -mt-16 px-5 md:px-10 xl:px-18">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard value={stats?.received} label="Reports filed" />
        <StatCard value={stats?.resolved} label="Resolved and verified" tone="forest" />
        <StatCard value={stats?.avgDays} decimals={1} unit="days" label="Average time to fix" />
        <StatCard
          value={stats?.reopenedPercent}
          decimals={1}
          suffix="%"
          label="Reopened after closing"
        />
      </div>
    </section>
  )
}