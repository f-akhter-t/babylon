import { useEffect, useRef } from 'react'
import { animate, SHAKE, SPRING } from '../../components/ui/motion'

// Red message over the map when a pin is dropped outside the region.
// attempt goes up on every blocked try, so the box shakes again each time.
// pointer-events-none: it never blocks clicks on the map underneath.
// It sits just below the "Click the map to drop a pin" bar.
export default function RegionNotice({ attempt }) {
  const ref = useRef(null)

  useEffect(() => {
    animate(ref.current, SHAKE, { duration: 360, easing: SPRING })
  }, [attempt])

  return (
    <div
      ref={ref}
      role="status"
      className="pointer-events-none absolute left-1/2 top-32 z-1000 -translate-x-1/2 whitespace-nowrap rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white shadow-xl lg:top-16"
    >
      Can't drop pin here, outside of region.
    </div>
  )
}
