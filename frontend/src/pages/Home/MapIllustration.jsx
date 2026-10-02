// [x, y, width, height]
const buildings = [
  [105, 160, 34, 28],
  [110, 205, 30, 22],
  [150, 170, 26, 22],
  [265, 140, 40, 30],
  [270, 200, 30, 26],
  [400, 200, 34, 30],
  [470, 190, 46, 34],
  [420, 290, 50, 38],
  [270, 300, 36, 28],
]

export default function MapIllustration() {
  return (
    <svg
      viewBox="0 0 620 440"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      aria-hidden="true"
    >
      <rect width="620" height="440" className="fill-map-land" />

      <rect x="425" y="45" width="150" height="105" rx="18" className="fill-map-park" />
      <rect x="70" y="300" width="130" height="75" rx="14" className="fill-map-park" />

      {buildings.map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="4" className="fill-muted/20" />
      ))}

      {/* White side roads */}
      <rect x="85" y="0" width="7" height="440" className="fill-white" />
      <rect x="235" y="0" width="7" height="440" className="fill-white" />
      <rect x="545" y="0" width="7" height="440" className="fill-white" />
      <rect x="0" y="255" width="620" height="7" className="fill-white" />

      {/* Main roads */}
      <rect x="350" y="0" width="16" height="440" className="fill-amber/40" />
      <rect x="0" y="110" width="620" height="16" className="fill-amber/40" />

      {/* Canal, drawn last so it covers the road ends */}
      <path
        d="M0 360 C110 335 230 385 360 372 C470 360 540 340 620 362 V440 H0 Z"
        className="fill-map-water"
      />

      <text x="24" y="122" className="fill-muted text-[11px]">Station Road</text>
      <text x="470" y="412" className="fill-muted text-[11px]">Canal</text>
    </svg>
  )
}