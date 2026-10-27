import clsx from 'clsx'
import { useT } from '../../i18n/useLanguage'

const inputClasses =
  'w-full rounded-2xl border bg-white px-4 py-3 font-body text-sm text-navy transition placeholder:text-muted hover:border-forest/50 focus:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 disabled:cursor-not-allowed disabled:bg-white/60 disabled:text-slate'

// A labelled input with an optional hint and an error under it.
// Pass as="select" with <option> children for a dropdown.
export default function TextField({ id, label, hint, error, as = 'input', className, ...props }) {
  const t = useT()
  const Field = as
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="font-body text-sm font-semibold text-navy">
        {t(label)}
      </label>
      <Field
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={clsx(hintId, errorId) || undefined}
        className={clsx(inputClasses, error ? 'border-danger' : 'border-navy/15')}
        {...props}
      />
      {hint && (
        <p id={hintId} className="font-body text-xs text-muted">
          {t(hint)}
        </p>
      )}
      {error && (
        <p id={errorId} className="font-body text-xs font-semibold text-danger">
          {t(error)}
        </p>
      )}
    </div>
  )
}
