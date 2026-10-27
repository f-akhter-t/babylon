import clsx from 'clsx'
import { SKYLINE, SKYLINE_VIEWBOX, litBuildings } from './skyline'

// Four buildings, like the Babylon logo. level 1 to 3 lights 1, 2 or all 4.
export default function StaircaseIcon({ level = 0, className }) {
  const lit = litBuildings(level)

  return (
    <svg
      viewBox={SKYLINE_VIEWBOX}
      width="16"
      height="9.4"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      {SKYLINE.map((bar, i) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={bar.y}
          width={bar.w}
          height={bar.h}
          rx="0.5"
          className={clsx(i >= lit && 'opacity-30')}
        />
      ))}
    </svg>
  )
}
