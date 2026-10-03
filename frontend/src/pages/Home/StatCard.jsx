import clsx from 'clsx'

export default function StatCard({ value, unit, label, tone = 'navy' }) {
  return (
    <div className="rounded-panel bg-mint px-5 py-5 shadow-xl shadow-navy/20 sm:px-6 sm:py-5.5">
      <p
        className={clsx(
          'font-heading text-4xl font-extrabold leading-none tracking-[-0.03em] sm:text-[50px]',
          tone === 'forest' ? 'text-forest' : 'text-navy',
        )}
      >
        {value}
        {unit && <span className="ml-1.5 text-xl tracking-normal">{unit}</span>}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate">{label}</p>
    </div>
  )
}