import { prefersLessMotion } from '../Map/motion'

const SECTIONS = [
  { label: 'Details', id: 'profile-details' },
  { label: 'Phone', id: 'profile-phone' },
  { label: 'Identity', id: 'profile-identity' },
  { label: 'Security', id: 'profile-security' },
]

// Phones: chips under the title that jump to a section and move focus to its
// heading. Buttons, not #links, so the address and history stay the same.
// The Security chip shows only when that section is on the page.
export default function JumpChips({ withSecurity = false }) {
  const sections = withSecurity ? SECTIONS : SECTIONS.filter((s) => s.id !== 'profile-security')

  function jump(id) {
    const heading = document.getElementById(id)
    if (!heading) return
    heading.closest('section')?.scrollIntoView({
      behavior: prefersLessMotion() ? 'auto' : 'smooth',
      block: 'start',
    })
    heading.focus({ preventScroll: true })
  }

  return (
    <nav aria-label="Profile sections" className="mt-4 flex flex-wrap gap-2 lg:hidden">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => jump(section.id)}
          className="rounded-full border border-navy/20 bg-white/70 px-4 py-2 max-md:min-h-11 font-body text-sm font-semibold text-navy transition hover:-translate-y-0.5 hover:border-navy hover:bg-navy hover:text-mint hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
        >
          {section.label}
        </button>
      ))}
    </nav>
  )
}
