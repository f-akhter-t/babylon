import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { ROLES } from '../../services/auth'

export function RoleTabs({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-full bg-white p-1">
      {ROLES.map((role) => (
        <button
          key={role.id}
          type="button"
          onClick={() => onChange(role.id)}
          className={clsx(
            'rounded-full px-4 py-2.5 font-body text-sm font-bold transition-colors',
            value === role.id ? 'bg-navy text-mint' : 'text-navy hover:bg-mint-deep',
          )}
        >
          {role.label}
        </button>
      ))}
    </div>
  )
}

export function Field({ id, label, children, ...props }) {
  const classes =
    'mt-2 w-full rounded-tile border border-navy/20 bg-white px-4 py-3 font-body text-base text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest'

  return (
    <div>
      <label htmlFor={id} className="font-body text-sm font-bold text-navy">
        {label}
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

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-page font-body">
      <header className="bg-navy px-8 py-5">
        <Link to="/" className="font-heading text-2xl font-extrabold text-mint">
          Babylon
        </Link>
      </header>

      <main className="mx-auto max-w-[480px] px-4 py-12">
        <div className="rounded-panel bg-mint p-8">
          <h1 className="font-heading text-4xl font-extrabold text-navy">{title}</h1>
          <p className="mt-1 font-body text-base text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-5 text-center font-body text-base text-navy">{footer}</p>
      </main>
    </div>
  )
}