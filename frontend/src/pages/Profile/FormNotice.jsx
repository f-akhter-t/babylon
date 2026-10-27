import clsx from 'clsx'
import { useT } from '../../i18n/useLanguage'

// A one-line message under a form: tone 'success' after saving, 'error' when
// something failed, 'info' for neutral notes. Renders nothing without text.
// Errors are read out at once (role="alert"). Success and info messages are
// read out by the page's announcer instead, so they are not heard twice.
export default function FormNotice({ tone = 'info', children }) {
  const t = useT()
  if (!children) return null

  return (
    <p
      role={tone === 'error' ? 'alert' : undefined}
      className={clsx(
        'rounded-tile px-4 py-2.5 font-body text-sm font-semibold',
        tone === 'success' && 'bg-brand/20 text-accent',
        tone === 'error' && 'bg-danger/10 text-alert',
        tone === 'info' && 'bg-white/70 text-navy',
      )}
    >
      {typeof children === 'string' ? t(children) : children}
    </p>
  )
}
