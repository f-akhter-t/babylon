import { useEffect, useState } from 'react'
import clsx from 'clsx'
import Button from '../../components/ui/Button'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import { PlusIcon, ArrowRightIcon, CheckIcon } from './HomeIcons'
import { useT } from '../../i18n/useLanguage'

// One piece of the slide. It rises in and fades in after "order" steps.
function Line({ as: Tag = 'span', shown, order, className, children }) {
  return (
    <Tag
      style={{ transitionDelay: shown ? `${150 + order * 110}ms` : '0ms' }}
      className={clsx(
        'transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

// The text of one slide. "as" is h1 for the first slide and h2 for the others,
// so the page has only one h1.
export default function HeroSlide({ slide, active = true, as: Heading = 'h2' }) {
  const t = useT()
  // Wait one frame so the first slide also animates on page load.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const shown = active && mounted

  const headCount = slide.headline.length
  const nextStep = headCount + slide.accent.length

  return (
    <div className="max-w-[560px]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate bg-white/5 px-4 py-2 text-[13px] font-bold uppercase tracking-widest text-brand">
          <StaircaseIcon level={3} />
          {t(slide.badge)}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate bg-white/5 px-4 py-2 text-[13px] font-bold uppercase tracking-widest text-mint">
          <span aria-hidden="true" className="size-2.5 rounded-full bg-flag-red" />
          {t('For all of Bangladesh')}
        </span>
      </div>

      <Heading className="mt-5.5 font-heading text-[40px] font-extrabold leading-[0.98] tracking-[-0.04em] text-mint sm:text-[64px] xl:text-[76px]">
        {slide.headline.map((line, i) => (
          <Line key={line} shown={shown} order={i} className="block">
            {t(line)}
          </Line>
        ))}
        <span className="block text-brand">
          {slide.accent.map((line, i) => (
            <Line key={line} shown={shown} order={headCount + i} className="block">
              {t(line)}
            </Line>
          ))}
        </span>
      </Heading>

      <Line
        as="p"
        shown={shown}
        order={nextStep}
        className="mt-5.5 max-w-[540px] text-lg leading-normal text-page"
      >
        {t(slide.text)}
      </Line>

      <Line as="div" shown={shown} order={nextStep + 1} className="mt-5.5 flex flex-wrap gap-3.5">
        <Button variant="brand" size="lg" to={slide.primary.to}>
          <PlusIcon className="size-5" /> {t(slide.primary.label)}
        </Button>
        <Button variant="outline-light" size="lg" to={slide.secondary.to}>
          {t(slide.secondary.label)} <ArrowRightIcon className="size-[18px]" />
        </Button>
      </Line>

      <Line
        as="ul"
        shown={shown}
        order={nextStep + 2}
        className="mt-5.5 flex flex-wrap gap-x-5.5 gap-y-2 text-sm font-semibold text-page"
      >
        {slide.perks.map((perk) => (
          <li key={perk} className="flex items-center gap-2">
            <CheckIcon className="size-4 text-brand" />
            {t(perk)}
          </li>
        ))}
      </Line>
    </div>
  )
}