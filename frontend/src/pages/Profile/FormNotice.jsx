import clsx from 'clsx'

// A one-line message under a form: tone 'success' after saving, 'error' when
// something failed, 'info' for neutral notes. Renders nothing without text.
export default function FormNotice({ tone = 'info', children }) {
  if (!children) return null

  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={clsx(
        'rounded-tile px-4 py-2.5 font-body text-sm font-semibold',
        tone === 'success' && 'bg-brand/20 text-forest',
        tone === 'error' && 'bg-danger/10 text-danger',
        tone === 'info' && 'bg-white/70 text-navy',
      )}
    >
      {children}
    </p>
  )
}
