import clsx from 'clsx'
import CountUp from '../../components/ui/CountUp'

// value is a number (or undefined while loading).
// decimals: digits after the point. suffix: text right after the number, like "%".
export default function StatCard({
  value,
  decimals = 0,
  suffix = '',
  unit,
  label,
  tone = 'navy',
}) {
  const format = (n) =>
    `${n.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`

  return (
    <div
      className="lift group rounded-panel bg-mint px-5 py-5 shadow-xl shadow-navy/20 sm:px-6 sm:py-5.5"
    >
      <p
        className={clsx(
          'origin-left font-heading text-4xl font-extrabold leading-none tracking-[-0.03em] tabular-nums transition-transform duration-300 group-hover:scale-105 sm:text-[50px]',
          tone === 'forest' ? 'text-forest' : 'text-navy',
        )}
      >
        <CountUp value={value} format={format} />
        {unit && <span className="ml-1.5 text-xl tracking-normal">{unit}</span>}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate">{label}</p>
    </div>
  )
}