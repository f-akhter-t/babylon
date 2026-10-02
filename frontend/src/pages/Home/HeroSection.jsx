import Button from '../../components/ui/Button'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import HeroMapArt from './HeroMapArt'
import { PlusIcon, ArrowRightIcon, CheckIcon } from './HomeIcons'

const perks = [
  "Upvote, don't duplicate",
  'Photo proof to close',
  'Live status updates',
]

export default function HeroSection({ issue }) {
  return (
    <section className="bg-navy px-18 pb-24 pt-12">
      <div className="grid grid-cols-[1fr_620px] items-center gap-12">
        <div className="max-w-[560px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-brand">
            <StaircaseIcon level={3} />
            Civic issue reporting
          </span>

          <h1 className="mt-6 font-heading text-[80px] font-extrabold leading-[0.95] tracking-tight text-mint">
            See it.
            <br />
            Pin it.
            <span className="block text-brand">
              Watch it
              <br />
              get fixed.
            </span>
          </h1>

          <p className="mt-6 max-w-[520px] text-lg leading-relaxed text-white/80">
            Report potholes, broken bridges and uncollected garbage on the map.
            Follow every report from Open to Resolved, with photo proof before
            it closes.
          </p>

          <div className="mt-8 flex gap-3">
            <Button variant="brand" to="/report" className="px-7 py-4 text-base">
              <PlusIcon /> Report an issue
            </Button>
            <Button variant="outline-light" to="/map" className="px-7 py-4 text-base">
              Explore the map <ArrowRightIcon className="size-4" />
            </Button>
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-2">
                <CheckIcon className="size-4 text-brand" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <HeroMapArt issue={issue} />
      </div>
    </section>
  )
}