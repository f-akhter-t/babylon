import { useState } from 'react'

const COUNT = 16

// One of the Dhaka street/river photos, picked at random each time a page
// opens, laid very faintly over the light background. Decorative only.
export function CityPhoto({ opacity = 'opacity-[0.06]' }) {
  const [n] = useState(() => String(1 + Math.floor(Math.random() * COUNT)).padStart(2, '0'))
  return (
    <img
      src={`/images/backdrop/bd-${n}.jpg`}
      alt=""
      aria-hidden="true"
      decoding="async"
      className={`absolute inset-0 size-full object-cover saturate-[0.8] ${opacity}`}
    />
  )
}

// A stand-alone fixed backdrop for pages that do not use AnimatedBackground.
export default function PhotoBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <CityPhoto />
    </div>
  )
}
