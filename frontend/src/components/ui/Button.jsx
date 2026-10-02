import { Link } from 'react-router-dom'
import clsx from 'clsx'

const variants = {
  primary: 'bg-forest text-white hover:bg-forest/90',
  brand: 'bg-brand text-navy hover:bg-brand/90',
  dark: 'bg-navy text-white hover:bg-navy/90',
  outline: 'border border-navy text-navy hover:bg-navy/10',
  'outline-light': 'border border-white/60 text-white hover:bg-white/10',
}

export default function Button({
  variant = 'primary',
  to,
  className,
  children,
  ...props
}) {
  const classes = clsx(
    'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3',
    'font-body text-sm font-semibold transition active:scale-95',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
    variants[variant],
    className,
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}