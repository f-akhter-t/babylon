// Small static map used on report cards and in the detail modal (no Leaflet needed here)
export default function MapIllustration({ pinClass = 'left-1/2 top-[44%] w-[22px]' }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-map-land">
      <svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <rect x="95" y="8" width="55" height="40" rx="4" className="fill-map-park" />
        <rect x="0" y="92" width="160" height="28" className="fill-map-water" />
        <rect x="0" y="52" width="160" height="9" className="fill-amber/40 stroke-amber" strokeWidth="1" />
        <rect x="62" y="0" width="9" height="92" className="fill-amber/40 stroke-amber" strokeWidth="1" />
        <rect x="0" y="80" width="160" height="3" fill="white" />
        <rect x="115" y="0" width="3" height="92" fill="white" />
        <rect x="12" y="14" width="22" height="16" rx="2" className="fill-slate/10" />
        <rect x="80" y="64" width="20" height="12" rx="2" className="fill-slate/10" />
      </svg>
      <svg viewBox="0 0 24 30" className={`absolute -translate-x-1/2 -translate-y-full ${pinClass}`} aria-hidden="true">
        <path d="M12 29C5 20 2 15 2 11a10 10 0 0 1 20 0c0 4-3 9-10 18z" className="fill-amber stroke-navy" strokeWidth="2" />
        <circle cx="12" cy="11" r="3.5" className="fill-navy" />
      </svg>
    </div>
  )
}
