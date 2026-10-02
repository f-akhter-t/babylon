import StaircaseIcon from '../../components/ui/StaircaseIcon'
import StatusPill from '../../components/ui/StatusPill'
import MapIllustration from './MapIllustration'
import MapPin from './MapPin'
import { CheckIcon } from './HomeIcons'

// x and y are percentages of the map frame. y is the tip of the pin.
const pins = [
  { status: 'resolved', x: 15, y: 52 },
  { status: 'in-progress', x: 33, y: 70 },
  { status: 'open', x: 53, y: 65 },
  { status: 'resolved', x: 77, y: 42 },
  { status: 'in-progress', x: 91, y: 25 },
  { status: 'open', x: 87, y: 52 },
]

export default function HeroMapArt({ issue }) {
  return (
    <div className="relative h-[440px] w-full">
      {/* Two colored layers behind the map */}
      <div className="absolute inset-0 -translate-x-11 translate-y-11 rounded-hero bg-forest" />
      <div className="absolute inset-0 -translate-x-5 translate-y-5 rounded-hero bg-slate" />

      {/* Map frame */}
      <div className="absolute inset-0 overflow-hidden rounded-hero border-4 border-mint">
        <MapIllustration />
      </div>

      {pins.map((pin, i) => (
        <MapPin key={i} {...pin} />
      ))}
      {issue && <MapPin status={issue.status} x={41} y={52} selected />}

      {/* Popup for the selected pin. Data comes from the issue list. */}
      {issue && (
        <div className="absolute left-[41%] top-[17%] z-10 w-60 -translate-x-1/2 rounded-tile bg-white px-4 py-3 shadow-lg">
          <p className="text-sm font-bold text-navy">{issue.title}</p>
          <div className="mt-2 flex items-center justify-between">
            <StatusPill status={issue.status} />
            <span className="text-sm font-semibold text-navy">↑ {issue.votes}</span>
          </div>
          <span className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-white" />
        </div>
      )}

      {/* Floating status card (sample text, matches the alert in mock/user.js) */}
      <div className="absolute -left-16 top-2 z-20 flex w-64 items-center gap-3 rounded-tile bg-mint px-4 py-3 shadow-lg">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate text-mint">
          <StaircaseIcon level={2} />
        </span>
        <div>
          <p className="text-xs text-slate">Status update</p>
          <p className="text-sm font-bold leading-tight text-navy">
            Your report was sent to Roads & Highways
          </p>
        </div>
      </div>

      <div className="absolute -bottom-4 -right-4 z-20 flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 shadow-lg">
        <span className="flex size-6 items-center justify-center rounded-full bg-navy text-brand">
          <CheckIcon className="size-3.5" />
        </span>
        <span className="text-sm font-semibold text-navy">Fix verified by admin</span>
      </div>
    </div>
  )
}