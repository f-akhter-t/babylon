import { Link } from 'react-router-dom'
import clsx from 'clsx'

const variants = {
  primary: 'bg-forest text-paper hover:bg-forest/90',
  brand: 'bg-brand text-ink hover:bg-brand/90',
  dark: 'bg-ink text-paper hover:bg-ink/90',
  outline: 'border-2 border-navy text-navy hover:bg-ink/10',
  'outline-light': 'border-2 border-mint text-frost hover:bg-paper/10',
}

const sizes = {
  md: 'px-5 py-3 text-sm font-semibold',
  lg: 'h-[58px] gap-2.5 px-7.5 text-[17px] font-bold',
  nav: 'h-11 px-5.5 text-base font-bold',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  to,
  className,
  children,
  ...props
}) {
  const classes = clsx(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full',
    'font-body transition active:scale-95',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
    sizes[size],
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