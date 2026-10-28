import { useRef } from 'react'
import Logo from '../../components/layout/Logo'
import FlagStripe from '../../components/layout/FlagStripe'
import ThemeToggle from '../../components/ui/ThemeToggle'
import LanguageToggle from '../../components/layout/LanguageToggle'
import clsx from 'clsx'
import { useT } from '../../i18n/useLanguage'

// Staff pages pick Department or Admin. A radio group: one tab stop,
// arrow keys (and Home/End) move the choice, like native radio buttons.
export function RoleRadioGroup({ label, options, value, onChange }) {
  const t = useT()
  const refs = useRef([])
  const labelId = 'role-group-label'

  function handleKeyDown(event, index) {
    const last = options.length - 1
    const next = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowDown: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      ArrowUp: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    onChange(options[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div>
      <p id={labelId} className="font-body text-sm font-bold text-navy">
        {t(label)}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="mt-2 grid grid-cols-2 gap-1 rounded-full bg-white p-1"
      >
        {options.map((option, index) => {
          const checked = value === option.id
          return (
            <button
              key={option.id}
              ref={(el) => {
                refs.current[index] = el
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              onClick={() => onChange(option.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={clsx(
                'min-h-11 rounded-full px-4 py-2.5 font-body text-sm font-bold transition-colors motion-reduce:transition-none',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                checked ? 'bg-ink text-frost' : 'text-navy hover:bg-mint-deep',
              )}
            >
              {t(option.label)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function Field({ id, label, children, ...props }) {
  const t = useT()
  if (props.placeholder) props = { ...props, placeholder: t(props.placeholder) }
  const classes =
    'mt-2 w-full rounded-tile border border-navy/60 bg-white px-4 py-3 font-body text-base text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent'

  return (
    <div>
      <label htmlFor={id} className="font-body text-sm font-bold text-navy">
        {t(label)}
      </label>
      {children ? (
        <select id={id} className={classes} {...props}>
          {children}
        </select>
      ) : (
        <input id={id} className={classes} {...props} />
      )}
    </div>
  )
}

// A form error, read out by screen readers. `action` is an optional link
// shown under the message (for example, to the other sign-in page).
export function FormError({ message, action }) {
  const t = useT()
  if (!message) return null
  return (
    <div role="alert" className="font-body text-sm font-bold text-alert">
      <p>{t(message)}</p>
      {action}
    </div>
  )
}

export function SubmitButton({ disabled, children }) {
  const t = useT()
  return (
    <button
      type="submit"
      disabled={disabled}
      className={clsx(
        'min-h-11 rounded-full bg-ink px-6 py-3.5 font-body text-base font-bold text-frost transition-opacity motion-reduce:transition-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:opacity-90',
      )}
    >
      {typeof children === 'string' ? t(children) : children}
    </button>
  )
}

// Demo details under the form. Each line is one whole sentence or a
// role and email pair, so they can be translated later.
export function DemoHint({ accounts = [], lines = [] }) {
  const t = useT()
  return (
    <div className="mt-5 rounded-tile bg-white px-4 py-3 font-body text-sm text-soft">
      {accounts.length > 0 && (
        <>
          <p className="font-bold text-navy">
            {accounts.length === 1 ? t('Demo account') : t('Demo accounts')}
          </p>
          <dl className="mt-1 flex flex-col gap-1">
            {accounts.map((account) => (
              <div key={account.email} className="flex flex-wrap gap-x-2">
                <dt>{t(account.role)}:</dt>
                <dd className="font-bold break-all text-navy">{account.email}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
      {lines.map((line) => (
        <p key={line} className={clsx(accounts.length > 0 && 'mt-1')}>
          {t(line)}
        </p>
      ))}
    </div>
  )
}

export const authLinkClass =
  'inline-flex min-h-11 items-center font-bold underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

// Shared by the citizen pages (/login, /signup) and the staff pages
// (/staff/login, /staff/signup). Staff pages get a "Staff" label in the
// header and a navy title band, so they can't be mistaken for the citizen ones.
// `photo` ({ src, side: 'left' | 'right' }) adds a street photo beside the form on wide screens.
export default function AuthShell({ variant = 'citizen', title, subtitle, children, footer, extra, photo }) {
  const t = useT()
  const staff = variant === 'staff'

  return (
    <div className="min-h-screen bg-page font-body">
      <header className="flex min-h-17 flex-wrap items-center gap-3 bg-ink px-4 py-3 sm:px-8">
        <Logo />
        {staff && (
          <span className="rounded-full bg-frost px-3 py-1 font-body text-sm font-bold text-ink">
            {t('Staff')}
          </span>
        )}
        <LanguageToggle className="ml-auto" />
        <ThemeToggle />
      </header>
      <FlagStripe />

      <main className={clsx('mx-auto px-4 py-8 sm:py-12', photo ? 'max-w-[480px] lg:max-w-5xl' : 'max-w-[480px]')}>
        <div className={clsx(photo && 'lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-8')}>
        {photo && (
          <div
            className={clsx(
              'relative hidden overflow-hidden rounded-panel bg-ink lg:block',
              photo.side === 'left' ? 'lg:order-first' : 'lg:order-last',
            )}
          >
            <img
              src={photo.src}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-ink/60 via-transparent to-transparent" />
          </div>
        )}
        <div className="overflow-hidden rounded-panel bg-mint">
          <div className={clsx(staff ? 'bg-ink px-6 py-6 sm:px-8' : 'px-6 pt-8 sm:px-8')}>
            <h1
              className={clsx(
                'font-heading text-4xl font-extrabold',
                staff ? 'text-frost' : 'text-navy',
              )}
            >
              {t(title)}
            </h1>
            <p className={clsx('mt-1 font-body text-base', staff ? 'text-frost' : 'text-muted')}>
              {t(subtitle)}
            </p>
          </div>
          <div className="px-6 pt-6 pb-8 sm:px-8">{children}</div>
        </div>
        </div>
        <p className="mt-5 text-center font-body text-base text-navy">{footer}</p>
        {extra && <p className="mt-1 text-center font-body text-sm text-navy">{extra}</p>}
      </main>
    </div>
  )
}
