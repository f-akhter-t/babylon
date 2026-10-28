import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { useLanguage, useT } from '../../i18n/useLanguage'

// tag: the size of the small "For Bangladesh" line under the name (none on sm).
const sizes = {
  sm: { mark: 'size-7', word: 'text-xl', tag: null },
  md: { mark: 'size-8 sm:size-[36px]', word: 'text-2xl sm:text-[28px]', tag: 'text-[9px] sm:text-[10px]', tagBn: 'text-[13.5px] sm:text-[15.5px]' },
  lg: { mark: 'size-10', word: 'text-3xl', tag: 'text-[11px]', tagBn: 'text-[16.5px]' },
}

const tones = {
  onDark: { text: 'text-frost', pin: 'fill-flag-green', line: 'bg-flag-green-light' },
  onLight: { text: 'text-navy', pin: 'fill-flag-green', line: 'bg-flag-green' },
}

// The skyline, in white, stands on the pin and the red sun.
const SKYLINE = [
  { x: 9.8, y: 15, w: 2.6, h: 4.6 },
  { x: 13, y: 12.8, w: 3, h: 6.8 },
  { x: 16.6, y: 14.2, w: 2.6, h: 5.4 },
  { x: 19.7, y: 16.2, w: 2.2, h: 3.4 },
]

// The Babylon mark (a green pin with a red sun and a city skyline, like the
// Bangladesh flag) and the word "Babylon".
//   size:  'sm' | 'md' | 'lg'
//   tone:  'onDark' (mint) or 'onLight' (navy)
//   to:    where it links; null shows it without a link (loading and error screens)
//   label: the link's accessible name, one whole sentence that starts with "Babylon"
// Other props (onClick and so on) go to the link.
export default function Logo({
  size = 'md',
  tone = 'onDark',
  to = '/',
  label = 'Babylon home',
  className,
  ...linkProps
}) {
  const tr = useT()
  const { lang } = useLanguage()
  const s = sizes[size]
  const t = tones[tone]
  const isLink = to !== null

  const content = (
    <>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className={clsx(
          s.mark,
          'shrink-0',
          isLink &&
            'transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0',
        )}
      >
        <path
          d="M16 29.5C16 29.5 25.5 21.5 25.5 13.5A9.5 9.5 0 0 0 6.5 13.5C6.5 21.5 16 29.5 16 29.5Z"
          className={t.pin}
        />
        <circle cx="16" cy="12" r="5" className="fill-flag-red" />
        {SKYLINE.map((b) => (
          <rect key={b.x} x={b.x} y={b.y} width={b.w} height={b.h} rx="0.5" className="fill-white" />
        ))}
      </svg>
      <span className="flex flex-col">
        <span className={clsx(s.word, 'font-heading font-extrabold leading-none tracking-[-0.02em]')}>
          Babylon
        </span>
        {s.tag && (
          <>
            {/* The flag as a thin line: green, then red. */}
            <span aria-hidden="true" className="mt-1.5 flex h-[2px] w-full">
              <span className={clsx('flex-1', t.line)} />
              <span className="flex-1 bg-flag-red" />
            </span>
            {/* English is set in small capitals; Bangla keeps its normal letters. */}
            {/* Bangla is set larger so it is as wide as the name and the flag line. */}
            <span
              className={clsx(
                'mt-1 font-body font-bold',
                lang === 'bn'
                  ? clsx(s.tagBn, 'whitespace-nowrap leading-snug tracking-normal')
                  : clsx(s.tag, 'uppercase tracking-[0.2em]'),
              )}
            >
              {tr('For Bangladesh')}
            </span>
          </>
        )}
      </span>
    </>
  )

  const classes = clsx('flex items-center gap-2.5', t.text, className)

  if (!isLink) return <span className={classes}>{content}</span>

  return (
    <Link
      to={to}
      aria-label={tr(label)}
      // The ::before strip makes the tap target 44px tall without changing the layout.
      className={clsx(
        "group relative rounded-full before:absolute before:inset-x-0 before:top-1/2 before:h-11 before:-translate-y-1/2 before:content-['']",
        classes,
      )}
      {...linkProps}
    >
      {content}
    </Link>
  )
}
