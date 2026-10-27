import { SKYLINE, SKYLINE_VIEWBOX, litBuildings } from './skyline'
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const BellIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...base}>
    <path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4" />
  </svg>
)
export const PinIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21c-5-6-7-9-7-12a7 7 0 0 1 14 0c0 3-2 6-7 12z" {...base} />
    <circle cx="12" cy="9" r="2.5" fill="currentColor" />
  </svg>
)
export const CameraIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...base}>
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
)
export const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...base} strokeWidth={2.4}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)
export const ArrowUpIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...base} strokeWidth={2.2}>
    <path d="M12 19V6M6 11l6-6 6 6" />
  </svg>
)
export const UserIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...base}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1-4 4-6 8-6s7 2 8 6" />
  </svg>
)
export const ReopenIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...base} strokeWidth={2}>
    <path d="M19 12a7 7 0 1 1-2.5-5.4M19 4v4h-4" />
  </svg>
)
export const CloseIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...base} strokeWidth={2.2}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

// the four logo buildings, used for status and department updates
export const BarsIcon = ({ size = 18, filled = 3, className = '' }) => {
  const lit = litBuildings(filled)
  return (
    <svg width={size} height={size * 0.6} viewBox={SKYLINE_VIEWBOX} aria-hidden="true" className={className}>
      {SKYLINE.map((bar, index) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={bar.y}
          width={bar.w}
          height={bar.h}
          rx="0.5"
          fill="currentColor"
          opacity={index < lit ? 1 : 0.3}
        />
      ))}
    </svg>
  )
}
