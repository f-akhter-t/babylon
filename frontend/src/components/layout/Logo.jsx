import { Link } from 'react-router-dom'

export default function Logo() {
  return (
    <Link
      to="/"
      aria-label="Babylon home"
      className="group flex items-center gap-2.5 rounded-full text-mint"
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="size-8 transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 sm:size-[36px]"
      >
        <path
          d="M16 29.5C16 29.5 25.5 21.5 25.5 13.5A9.5 9.5 0 0 0 6.5 13.5C6.5 21.5 16 29.5 16 29.5Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <rect x="10.4" y="15.5" width="3.6" height="3.5" rx="0.8" className="fill-brand" />
        <rect x="14.2" y="12.5" width="3.6" height="6.5" rx="0.8" fill="currentColor" />
        <rect x="18" y="9.5" width="3.6" height="9.5" rx="0.8" fill="currentColor" />
      </svg>
      <span className="font-heading text-2xl font-extrabold tracking-[-0.02em] sm:text-[28px]">
        Babylon
      </span>
    </Link>
  )
}