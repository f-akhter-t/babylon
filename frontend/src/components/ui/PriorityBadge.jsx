import clsx from 'clsx'

const priorities = {
  urgent: { label: 'Urgent', style: 'bg-amber text-navy' },
  reopened: { label: 'Reopened', style: 'bg-amber text-navy' },
  high: { label: 'High', style: 'bg-navy text-white' },
  medium: { label: 'Medium', style: 'bg-mint text-navy' },
  'fix-verified': { label: 'Fix verified', style: 'bg-brand text-navy' },
}

export default function PriorityBadge({ priority, className }) {
  const { label, style } = priorities[priority]

  return (
    <span
      className={clsx(
        'inline-block rounded-full px-3 py-1 font-body text-xs font-semibold',
        style,
        className,
      )}
    >
      {label}
    </span>
  )
}