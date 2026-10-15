import Logo from './Logo'

// Hidden for the first 150 ms, then shown at once (no fade), so a fast load
// never flashes it. The 0s step is not motion, so reduced motion keeps it too.
const showLater = `
  @keyframes pageLoadingShow { to { opacity: 1; } }
`

// Shown while a page's code is loading: the logo, pulsing gently unless the
// person has asked for less motion.
export default function PageLoading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-page">
      <style>{showLater}</style>
      <div role="status" className="opacity-0" style={{ animation: 'pageLoadingShow 0s 150ms forwards' }}>
        <div className="motion-safe:animate-pulse">
          <Logo to={null} size="lg" tone="onLight" />
        </div>
        <span className="sr-only">Loading the page.</span>
      </div>
    </div>
  )
}
