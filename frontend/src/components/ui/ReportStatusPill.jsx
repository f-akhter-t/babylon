import clsx from 'clsx'
import { BarsIcon, ReopenIcon } from './icons'
import { statusLabel } from './statusLabel'
import { useT } from '../../i18n/useLanguage'
 
// Only uses theme colors (with opacity), so no extra Tailwind tokens are needed
const STATUS = {
  open:        { bg: 'bg-amber/25', bars: 1, tint: 'text-warn' },
  in_progress: { bg: 'bg-slate/15', bars: 2, tint: 'text-soft' },
  resolved:    { bg: 'bg-success-soft', bars: 3, tint: 'text-good' },
  reopened:    { bg: 'bg-amber',     bars: 0, tint: 'text-ink' },
}
 
export default function ReportStatusPill({ status }) {
  const t = useT()
  const s = STATUS[status]
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-[13px] font-bold text-navy', s.bg)}>
      {status === 'reopened' ? <ReopenIcon /> : <BarsIcon size={14} filled={s.bars} className={s.tint} />}
      {t(statusLabel(status))}
    </span>
  )
}
 