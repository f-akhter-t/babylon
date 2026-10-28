// Two thin stripes in the flag's colours, drawn under a top bar. They slide in
// from the left once. Decorative only, so screen readers skip it.
export default function FlagStripe({ className = '' }) {
  return (
    <div aria-hidden="true" className={`flex flex-col ${className}`}>
      <span
        className="block h-[3px] origin-left bg-flag-green"
        style={{ animation: 'grow-x 0.9s var(--ease-calm) both' }}
      />
      <span
        className="block h-[3px] origin-left bg-flag-red"
        style={{ animation: 'grow-x 0.9s var(--ease-calm) 0.12s both' }}
      />
    </div>
  )
}
