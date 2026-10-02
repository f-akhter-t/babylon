import clsx from 'clsx'

export default function StatCard({ value, unit, label, tone = 'navy' }) {
  return (
    <div className="rounded-card bg-mint px-6 py-5 shadow-xl shadow-navy/20">
      <p
        className={clsx(
          'font-heading text-5xl font-extrabold',
          tone === 'forest' ? 'text-forest' : 'text-navy',
        )}
      >
        {value}
        {unit && <span className="ml-1 text-xl font-semibold">{unit}</span>}
      </p>
      <p className="mt-1 text-sm text-slate">{label}</p>
    </div>
  )
}