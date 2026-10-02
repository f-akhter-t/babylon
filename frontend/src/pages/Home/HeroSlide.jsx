import Button from '../../components/ui/Button'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import HeroMapArt from './HeroMapArt'
import HeroVoteArt from './HeroVoteArt'
import HeroProofArt from './HeroProofArt'
import { PlusIcon, ArrowRightIcon, CheckIcon } from './HomeIcons'

// Picks the picture for the slide.
function SlideArt({ visual, issue, fixedIssue }) {
  if (visual === 'vote') return <HeroVoteArt issue={issue} />
  if (visual === 'proof') return <HeroProofArt issue={fixedIssue} />
  return <HeroMapArt issue={issue} />
}

// One slide. "as" is h1 for the first slide and h2 for the others,
// so the page has only one h1.
export default function HeroSlide({ slide, as: Heading = 'h2', issue, fixedIssue }) {
  return (
    <div className="grid grid-cols-1 gap-14 xl:grid-cols-[1fr_620px] xl:items-center xl:gap-12">
      <div className="max-w-[560px]">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate bg-white/5 px-4 py-2 text-[13px] font-bold uppercase tracking-widest text-brand">
          <StaircaseIcon level={3} />
          {slide.badge}
        </span>

        <Heading className="mt-5.5 font-heading text-[48px] font-extrabold leading-[0.98] tracking-[-0.04em] text-mint sm:text-[64px] xl:text-[76px]">
          {slide.headline.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
          <span className="block text-brand">
            {slide.accent.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </span>
        </Heading>

        <p className="mt-5.5 max-w-[540px] text-lg leading-normal text-page">{slide.text}</p>

        <div className="mt-5.5 flex flex-wrap gap-3.5">
          <Button variant="brand" size="lg" to={slide.primary.to}>
            <PlusIcon className="size-5" /> {slide.primary.label}
          </Button>
          <Button variant="outline-light" size="lg" to={slide.secondary.to}>
            {slide.secondary.label} <ArrowRightIcon className="size-[18px]" />
          </Button>
        </div>

        <ul className="mt-5.5 flex flex-wrap gap-x-5.5 gap-y-2 text-sm font-semibold text-page">
          {slide.perks.map((perk) => (
            <li key={perk} className="flex items-center gap-2">
              <CheckIcon className="size-4 text-brand" />
              {perk}
            </li>
          ))}
        </ul>
      </div>

      <SlideArt visual={slide.visual} issue={issue} fixedIssue={fixedIssue} />
    </div>
  )
}
