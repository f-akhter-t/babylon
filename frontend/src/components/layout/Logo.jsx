import { Link } from 'react-router-dom'

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 text-mint">
      <svg viewBox="0 0 24 28" width="22" height="26" aria-hidden="true">
        <path
          d="M12 26s9-8.2 9-15A9 9 0 0 0 3 11c0 6.8 9 15 9 15Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect x="8" y="13" width="2" height="3" fill="currentColor" />
        <rect x="11" y="11" width="2" height="5" fill="currentColor" />
        <rect x="14" y="9" width="2" height="7" fill="currentColor" />
      </svg>
      <span className="font-heading text-2xl font-extrabold">Babylon</span>
    </Link>
  )
}