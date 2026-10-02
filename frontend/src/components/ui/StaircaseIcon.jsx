import clsx from 'clsx'

export default function StaircaseIcon({ level = 0, className }) {
  const bars = [
    { x: 1, y: 8, h: 5 },
    { x: 6, y: 5, h: 8 },
    { x: 11, y: 2, h: 11 },
  ]

  return (
    <svg
      viewBox="0 0 16 14"
      width="16"
      height="14"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      {bars.map((bar, i) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={bar.y}
          width="3.5"
          height={bar.h}
          rx="1"
          className={clsx(i >= level && 'opacity-30')}
        />
      ))}
    </svg>
  )
}