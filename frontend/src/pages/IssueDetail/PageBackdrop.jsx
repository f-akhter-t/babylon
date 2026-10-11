// A soft mint glow at the top of the page that fades into the page grey.
// Only decoration: hidden from screen readers and from clicks.
export default function PageBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] overflow-hidden"
    >
      <div className="absolute inset-0 bg-linear-to-b from-mint via-mint/60 to-transparent" />
      <div className="absolute -right-32 -top-48 size-[38rem] rounded-full bg-brand/20 blur-3xl" />
      <div className="absolute -left-40 top-16 size-96 rounded-full bg-white/70 blur-3xl" />
    </div>
  )
}
