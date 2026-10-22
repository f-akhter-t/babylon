import Logo from './Logo'

// Hidden for the first 150 ms, then shown at once (a 0 s fade), so a fast
// load never flashes it. A delay is not motion, so reduced motion keeps it too.
// Shown while a page's code is loading: the logo, pulsing gently unless the
// person has asked for less motion.
export default function PageLoading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-page">
      <div role="status" style={{ animation: 'fade-in 0s 150ms both' }}>
        <div className="motion-safe:animate-pulse">
          <Logo to={null} size="lg" tone="onLight" />
        </div>
        <span className="sr-only">Loading the page.</span>
      </div>
    </div>
  )
}
