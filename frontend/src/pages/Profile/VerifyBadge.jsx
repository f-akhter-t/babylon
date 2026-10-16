import { useState } from 'react'
import clsx from 'clsx'

const tones = {
  verified: { label: 'Verified', light: 'bg-brand/25 text-forest', dark: 'bg-brand text-navy' },
  'not-verified': { label: 'Not verified', light: 'bg-navy/10 text-slate', dark: 'bg-mint/15 text-mint' },
  'not-submitted': { label: 'Not submitted', light: 'bg-navy/10 text-slate', dark: 'bg-mint/15 text-mint' },
  pending: { label: 'Pending review', light: 'bg-amber/30 text-navy', dark: 'bg-amber text-navy' },
  rejected: { label: 'Rejected', light: 'bg-danger/10 text-danger', dark: 'bg-danger text-mint' },
}

// A small status label for the phone and identity sections.
// Pass onDark when it sits on a navy background.
// It pops once when the status changes (not when the page first opens).
// label replaces the usual wording, for example "Department verified".
export default function VerifyBadge({ status, onDark = false, label }) {
  const tone = tones[status] ?? tones['not-verified']
  const [shown, setShown] = useState(status)
  const [pops, setPops] = useState(0)
  if (shown !== status) {
    setShown(status)
    setPops((count) => count + 1)
  }

  return (
    <span
      key={pops}
      style={pops ? { animation: 'pop var(--duration-slow) var(--ease-spring)' } : undefined}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-body text-xs font-bold',
        onDark ? tone.dark : tone.light,
      )}
    >
      {status === 'verified' && (
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m5 12 5 5 9-10" />
        </svg>
      )}
      {label ?? tone.label}
    </span>
  )
}
