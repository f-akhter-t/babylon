import clsx from 'clsx'
import { BarsIcon, ReopenIcon } from './icons'

// Only uses theme colors (with opacity), so no extra Tailwind tokens are needed
const STATUS = {
  open:        { label: 'Open',        bg: 'bg-amber/25', bars: 1, tint: 'text-amber-dark' },
  in_progress: { label: 'In progress', bg: 'bg-slate/15', bars: 2, tint: 'text-slate' },
  resolved:    { label: 'Resolved',    bg: 'bg-mint-deep', bars: 3, tint: 'text-forest' },
  reopened:    { label: 'Reopened',    bg: 'bg-amber',     bars: 0, tint: 'text-navy' },
}

export const statusLabel = (s) => STATUS[s].label

export default function ReportStatusPill({ status }) {
  const s = STATUS[status]
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-[13px] font-bold text-navy', s.bg)}>
      {status === 'reopened' ? <ReopenIcon /> : <BarsIcon size={14} filled={s.bars} className={s.tint} />}
      {s.label}
    </span>
  )
}
