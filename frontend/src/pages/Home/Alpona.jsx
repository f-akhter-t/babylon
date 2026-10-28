import { useMemo } from 'react'
import { corner, MOTIFS, BANGLADESH_PATH, DHAKA } from '../../utils/alponaArt'

// Very faint line art over the hero video. It draws itself in a moment after
// the page loads (the .alp rules in index.css).
//   top-left corner: a vine alpona growing out of the corner
//   along the bottom: a lotus mandala, a rickshaw, a hilsa and a shapla
//   right: the outline of Bangladesh, mostly behind the search card
// Decorative only, so screen readers skip all of it.
//
// The markup is built here from our own drawing code (no user input), so
// setting it as HTML is safe.
const base = 'pointer-events-none absolute max-w-none text-brand'
const svgProps = {
  viewBox: '0 0 400 400',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export default function Alpona() {
  const cornerArt = useMemo(() => corner(), [])
  const motifs = useMemo(() => MOTIFS.map((make) => make()), [])

  return (
    <div aria-hidden="true" className="alp">
      {/* The corner is drawn at the bottom-left, so it is turned over to sit top-left. */}
      <svg
        {...svgProps}
        className={`${base} -left-3 -top-3 w-[260px] opacity-[0.22] [mask-image:linear-gradient(to_bottom_right,black_35%,transparent_85%)] [transform:scaleY(-1)] lg:w-[420px]`}
        dangerouslySetInnerHTML={{ __html: cornerArt }}
      />

      <div
        className={`${base} inset-x-0 bottom-0 flex items-end justify-around gap-2 px-4 opacity-[0.17] [mask-image:linear-gradient(to_top,black_30%,transparent_100%)]`}
      >
        {motifs.map((art, i) => (
          <svg
            key={i}
            {...svgProps}
            className={`w-1/2 max-w-[300px] sm:w-1/4 ${i > 1 ? 'max-sm:hidden' : ''}`}
            dangerouslySetInnerHTML={{ __html: art }}
          />
        ))}
      </div>

      <svg
        viewBox="0 0 400 520"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        className={`${base} -right-10 top-1/2 h-[480px] -translate-y-1/2 opacity-[0.22] [mask-image:linear-gradient(to_left,black_45%,transparent_100%)] max-lg:hidden`}
      >
        <path d={BANGLADESH_PATH} pathLength="1" style={{ '--i': 3 }} />
        <circle className="dot" cx={DHAKA.x} cy={DHAKA.y} r="5" fill="#E4463D" stroke="none" style={{ '--i': 12 }} />
      </svg>
    </div>
  )
}
