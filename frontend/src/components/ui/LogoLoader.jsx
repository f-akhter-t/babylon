import clsx from 'clsx'
import Logo from '../layout/Logo'

// The Babylon logo, pulsing gently, for any place that waits for data. It
// stays hidden for the first 150 ms, so a quick load never flashes it, and it
// adds no work of its own: it only shows while the page is already waiting.
//   label:   what screen readers hear while it shows
//   compact: less space around it, for small areas
export default function LogoLoader({ label = 'Loading…', compact = false, tone = 'onLight', className }) {
  return (
    <div
      role="status"
      className={clsx('flex justify-center', compact ? 'py-6' : 'py-14', className)}
      style={{ animation: 'fade-in 0s 150ms both' }}
    >
      <div className="motion-safe:animate-pulse">
        <Logo to={null} size="lg" tone={tone} />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}
