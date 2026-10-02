import clsx from 'clsx'
import useCountUp from './useCountUp'

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
  const { ref, value: counted } = useCountUp(value)
  const text = typeof value === 'number' ? `${counted.toFixed(decimals)}${suffix}` : '–'

  return (
    <div
      ref={ref}
      className="rounded-panel bg-mint px-5 py-5 shadow-xl shadow-navy/20 sm:px-6 sm:py-5.5"
    >
      <p
        className={clsx(
          'font-heading text-4xl font-extrabold leading-none tracking-[-0.03em] tabular-nums sm:text-[50px]',
          tone === 'forest' ? 'text-forest' : 'text-navy',
        )}
      >
        {text}
        {unit && <span className="ml-1.5 text-xl tracking-normal">{unit}</span>}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate">{label}</p>
    </div>
  )
}