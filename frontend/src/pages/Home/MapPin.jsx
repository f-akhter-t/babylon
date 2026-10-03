import clsx from 'clsx'
import StaircaseIcon from '../../components/ui/StaircaseIcon'

const styles = {
  open: { body: 'text-amber', icon: 'text-navy', level: 1 },
  'in-progress': { body: 'text-slate', icon: 'text-white', level: 2 },
  resolved: { body: 'text-forest', icon: 'text-white', level: 3 },
}

export default function MapPin({ status, x, y, selected = false }) {
  const style = styles[status]

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-full"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {selected && (
        <span className="absolute bottom-0 left-1/2 h-5 w-12 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-amber" />
      )}
      <div className={clsx('relative origin-bottom', selected && 'scale-125')}>
        <svg
          viewBox="0 0 28 36"
          width="28"
          height="36"
          className={clsx('block drop-shadow', style.body)}
          aria-hidden="true"
        >
          <path
            d="M14 35C14 35 2 22 2 13a12 12 0 0 1 24 0c0 9-12 22-12 22z"
            fill="currentColor"
            strokeWidth="2"
            className={selected ? 'stroke-navy' : 'stroke-white'}
          />
        </svg>
        <StaircaseIcon
          level={style.level}
          className={clsx('absolute left-1/2 top-2 -translate-x-1/2 scale-90', style.icon)}
        />
      </div>
    </div>
  )
}