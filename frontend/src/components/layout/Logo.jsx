import { Link } from 'react-router-dom'

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 text-mint">
      <svg viewBox="0 0 32 32" width="34" height="34" fill="none" aria-hidden="true">
        <path
          d="M16 29C16 29 25 21 25 13.5A9 9 0 0 0 7 13.5C7 21 16 29 16 29Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <rect x="11.5" y="15" width="3" height="3" className="fill-brand" />
        <rect x="15" y="12.5" width="3" height="5.5" fill="currentColor" />
        <rect x="18.5" y="10" width="3" height="8" fill="currentColor" />
      </svg>
      <span className="font-heading text-[28px] font-extrabold tracking-[-0.02em]">
        Babylon
      </span>
    </Link>
  )
}