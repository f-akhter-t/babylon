import clsx from 'clsx'
import { useT } from '../../i18n/useLanguage'

export default function CategoryChip({
  label,
  active = false,
  tone = 'navy',
  onClick,
  className,
}) {
  const t = useT()
  const classes = clsx(
    'rounded-full border px-4 py-2 font-body text-sm font-medium transition-colors',
    active && tone === 'navy' && 'border-navy bg-ink text-paper',
    active && tone === 'forest' && 'border-accent bg-forest text-paper',
    !active && 'border-navy/60 text-navy',
    !active && onClick && 'hover:bg-ink/10',
    onClick && 'max-md:min-h-11', // a 44px target on phones
    className,
  )

  if (!onClick) {
    return <span className={classes}>{t(label)}</span>
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={classes}>
      {t(label)}
    </button>
  )
}