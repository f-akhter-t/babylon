import StaircaseIcon from '../../components/ui/StaircaseIcon'
import StatusPill from '../../components/ui/StatusPill'
import MapIllustration from './MapIllustration'
import MapPin from './MapPin'
import { CheckIcon } from './HomeIcons'

// x and y are percentages of the map frame. y is the tip of the pin.
const pins = [
  { status: 'resolved', x: 15, y: 58 },
  { status: 'in-progress', x: 33, y: 74 },
  { status: 'open', x: 53, y: 69 },
  { status: 'resolved', x: 77, y: 47 },
  { status: 'in-progress', x: 91, y: 29 },
  { status: 'open', x: 87, y: 56 },
]

export default function HeroMapArt({ issue }) {
  return (
    <div className="relative mx-auto aspect-[620/440] w-full max-w-[620px] xl:mx-0">
      {/* Two colored layers behind the map */}
      <div className="absolute inset-0 -translate-x-2 translate-y-2 rounded-hero bg-forest md:-translate-x-6 md:translate-y-6 xl:-translate-x-11 xl:translate-y-11" />
      <div className="absolute inset-0 -translate-x-1 translate-y-1 rounded-hero bg-slate md:-translate-x-3 md:translate-y-3 xl:-translate-x-5.5 xl:translate-y-5.5" />

      {/* Map frame */}
      <div className="absolute inset-0 overflow-hidden rounded-hero border-4 border-mint">
        <MapIllustration />
      </div>

      {pins.map((pin, i) => (
        <MapPin key={i} {...pin} />
      ))}
      {issue && <MapPin status={issue.status} x={41} y={57} selected />}

      {/* Popup for the selected pin. Data comes from the issue list. */}
      {issue && (
        <div className="absolute left-[41%] top-[20%] z-10 w-[220px] -translate-x-1/2 rounded-tile bg-white px-4 py-3 shadow-lg sm:w-[250px]">
          <p className="text-sm font-bold text-navy">{issue.title}</p>
          <div className="mt-2 flex items-center justify-between">
            <StatusPill status={issue.status} />
            <span className="text-sm font-semibold text-navy">↑ {issue.votes}</span>
          </div>
          <span className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-white" />
        </div>
      )}

      {/* Floating status card. Hidden on phones, where there is no room. */}
      <div className="absolute -top-6 left-0 z-20 hidden w-64 items-center gap-3 rounded-tile bg-mint px-4 py-3 shadow-lg md:flex xl:-left-16 xl:top-2">
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

      <div className="absolute bottom-2 right-2 z-20 flex h-12 items-center gap-2.5 rounded-full bg-brand pl-3.5 pr-5 shadow-lg xl:-bottom-5.5 xl:-right-7">
        <span className="flex size-7 items-center justify-center rounded-full bg-navy text-brand">
          <CheckIcon className="size-4" />
        </span>
        <span className="text-[15px] font-extrabold text-navy">Fix verified by admin</span>
      </div>
    </div>
  )
}