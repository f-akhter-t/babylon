import clsx from 'clsx'
import { BarsIcon, ReopenIcon } from './icons'
import { statusLabel } from './statusLabel'
 
// Only uses theme colors (with opacity), so no extra Tailwind tokens are needed
const STATUS = {
  open:        { bg: 'bg-amber/25', bars: 1, tint: 'text-amber-dark' },
  in_progress: { bg: 'bg-slate/15', bars: 2, tint: 'text-slate' },
  resolved:    { bg: 'bg-success-soft', bars: 3, tint: 'text-success' },
  reopened:    { bg: 'bg-amber',     bars: 0, tint: 'text-navy' },
}
 
export default function ReportStatusPill({ status }) {
  const s = STATUS[status]
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-[13px] font-bold text-navy', s.bg)}>
      {status === 'reopened' ? <ReopenIcon /> : <BarsIcon size={14} filled={s.bars} className={s.tint} />}
      {statusLabel(status)}
    </span>
  )
}
 