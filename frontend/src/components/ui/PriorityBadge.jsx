import clsx from 'clsx'

const priorities = {
  urgent: { label: 'Urgent', style: 'bg-amber text-navy' },
  reopened: { label: 'Reopened', style: 'bg-amber text-navy' },
  high: { label: 'High', style: 'bg-navy text-white' },
  medium: { label: 'Medium', style: 'bg-mint text-navy' },
  'fix-verified': { label: 'Fix verified', style: 'bg-brand text-navy' },
}

// `ai` marks a priority that CLIP set from the report photo, so people can tell it
// from one a person chose.
export default function PriorityBadge({ priority, ai = false, className }) {
  const { label, style } = priorities[priority]

  return (
    <span
      title={ai ? 'Priority assessed by AI from the report photo' : undefined}
      className={clsx(
        'inline-block rounded-full px-3 py-1 font-body text-xs font-semibold',
        style,
        className,
      )}
    >
      {label}
      {ai && (
        <span className="ml-1.5 border-l border-current pl-1.5 text-[10px] font-bold tracking-wide">AI</span>
      )}
    </span>
  )
}