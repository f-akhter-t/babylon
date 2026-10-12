import { RefreshIcon } from './DetailIcons'

// Only for issues where the same problem was fixed here before.
export default function SeenBeforeNote({ text }) {
  return (
    <aside
      aria-labelledby="seen-before-heading"
      className="flex gap-3 rounded-card border-2 border-amber-dark bg-amber/15 p-4"
    >
      <RefreshIcon size={20} className="mt-0.5 shrink-0 text-navy" />
      <div className="text-sm text-navy">
        <h2 id="seen-before-heading" className="font-heading text-base font-extrabold">
          Seen on this street before
        </h2>
        <p className="mt-1">
          {text} If a fixed problem comes back, it reopens and goes straight to the admin.
        </p>
      </div>
    </aside>
  )
}
