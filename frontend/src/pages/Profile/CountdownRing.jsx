// A small ring that empties as the resend timer counts down.
// Decoration only: the button text says the same in words.
const RADIUS = 8
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function CountdownRing({ secondsLeft, total }) {
  const share = total > 0 ? secondsLeft / total : 0

  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 -rotate-90" aria-hidden="true">
      <circle cx="10" cy="10" r={RADIUS} fill="none" strokeWidth="2.5" className="stroke-navy/15" />
      <circle
        cx="10"
        cy="10"
        r={RADIUS}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - share)}
        className="stroke-forest transition-[stroke-dashoffset] duration-1000 ease-linear"
      />
    </svg>
  )
}
