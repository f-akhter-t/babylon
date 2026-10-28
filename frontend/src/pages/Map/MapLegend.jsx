import clsx from 'clsx'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import { useT } from '../../i18n/useLanguage'

// Same colours and step counts as the pins in statusPin.js.
const items = [
  { label: 'Open', level: 1, color: 'text-warn' },
  { label: 'In progress', level: 2, color: 'text-soft' },
  { label: 'Resolved', level: 3, color: 'text-good' },
]

export default function MapLegend({ className }) {
  const t = useT()
  return (
    <div
      className={clsx(
        'flex flex-wrap items-center gap-x-4 gap-y-1 rounded-chip bg-white px-4 py-2.5 text-sm font-medium text-navy shadow-md',
        className,
      )}
    >
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <StaircaseIcon level={item.level} className={item.color} />
          {t(item.label)}
        </span>
      ))}
      <span className="text-soft">{t('More steps = closer to fixed')}</span>
    </div>
  )
}
