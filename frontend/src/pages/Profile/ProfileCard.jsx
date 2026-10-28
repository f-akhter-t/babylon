import { useT } from '../../i18n/useLanguage'

// The frame every profile section sits in: a heading, an optional badge
// on the right and a short line under the heading. The heading can take
// focus, so the jump chips can move people straight to a section.
export default function ProfileCard({ id, title, intro, badge, children }) {
  const t = useT()
  return (
    <section
      aria-labelledby={id}
      className="scroll-mt-24 rounded-card bg-mint/85 p-5 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-lg sm:p-6 md:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h2
          id={id}
          tabIndex={-1}
          className="rounded-chip font-heading text-xl font-extrabold text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          {t(title)}
        </h2>
        {badge}
      </div>
      {intro && <p className="mt-1 font-body text-sm text-soft">{t(intro)}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}
