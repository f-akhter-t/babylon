import clsx from 'clsx'
import StaircaseIcon from './StaircaseIcon'

const statuses = {
  open: { label: 'Open', level: 1 },
  'in-progress': { label: 'In progress', level: 2 },
  resolved: { label: 'Resolved', level: 3 },
}

const pillStyles = {
  open: 'bg-amber/30',
  'in-progress': 'bg-slate/15',
  resolved: 'bg-success-soft',
}

const iconStyles = {
  open: 'text-amber-dark',
  'in-progress': 'text-slate',
  resolved: 'text-success',
}

export default function StatusPill({ status, className }) {
  const { label, level } = statuses[status]

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full px-3 py-1',
        'font-body text-sm font-semibold text-navy',
        pillStyles[status],
        className,
      )}
    >
      <StaircaseIcon level={level} className={iconStyles[status]} />
      {label}
    </span>
  )
}