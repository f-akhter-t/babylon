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
    <section className="bg-navy px-5 pb-24 pt-8 md:px-10 md:pt-12 xl:px-18">
      <div className="grid grid-cols-1 gap-14 xl:grid-cols-[1fr_620px] xl:items-center xl:gap-12">
        <div className="max-w-[560px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate bg-white/5 px-4 py-2 text-[13px] font-bold uppercase tracking-widest text-brand">
            <StaircaseIcon level={3} />
            Civic issue reporting
          </span>

          <h1 className="mt-5.5 font-heading text-[48px] font-extrabold leading-[0.98] tracking-[-0.04em] text-mint sm:text-[64px] xl:text-[76px]">
            See it.
            <br />
            Pin it.
            <span className="block text-brand">
              Watch it
              <br />
              get fixed.
            </span>
          </h1>

          <p className="mt-5.5 max-w-[540px] text-lg leading-normal text-page">
            Report potholes, broken bridges and uncollected garbage on the map.
            Follow every report from Open to Resolved, with photo proof before
            it closes.
          </p>

          <div className="mt-5.5 flex flex-wrap gap-3.5">
            <Button variant="brand" size="lg" to="/report">
              <PlusIcon className="size-5" /> Report an issue
            </Button>
            <Button variant="outline-light" size="lg" to="/map">
              Explore the map <ArrowRightIcon className="size-[18px]" />
            </Button>
          </div>

          <ul className="mt-5.5 flex flex-wrap gap-x-5.5 gap-y-2 text-sm font-semibold text-page">
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