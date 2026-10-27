import Button from '../../components/ui/Button'
import Reveal from '../../components/ui/Reveal'
import StaircaseIcon from '../../components/ui/StaircaseIcon'
import { PlusIcon, ArrowRightIcon, CheckIcon } from './HomeIcons'
import { useT } from '../../i18n/useLanguage'

const perks = ['Takes about 30 seconds', 'No account needed to browse', 'Photo proof when it is fixed']

export default function FinalCtaBand() {
  const t = useT()
  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <img
        src="/images/cta-street.jpg"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 -z-10 size-full object-cover object-[center_55%]"
      />
      {/* Dark on the left (text), clear on the right (photo). On phones it is dark all over. */}
      <div className="absolute inset-0 -z-10 bg-ink/45 md:bg-transparent md:bg-linear-to-r md:from-ink/70 md:via-ink/15 md:to-transparent" />
      {/* The footer is navy, so the bottom fades to navy. */}
      <div className="absolute inset-x-0 bottom-0 -z-10 h-20 bg-linear-to-t from-ink to-transparent" />
      <div className="px-5 py-20 md:px-10 md:py-28 xl:px-18">
        <Reveal>
          <div className="max-w-[780px]">
            <StaircaseIcon level={3} className="h-9 w-10 text-brand" />
            <h2 className="mt-5 font-heading text-4xl font-extrabold leading-[1.02] tracking-[-0.03em] text-frost md:text-6xl">
              {t('See a problem?')}
              <span className="block text-brand">{t('Report it in 30 seconds.')}</span>
            </h2>
            <p className="mt-4 max-w-[480px] text-lg leading-normal text-page">
              {t('Snap a photo, drop a pin, pick a category. We send it to the right department.')}
            </p>

            <div className="mt-7 flex flex-wrap gap-3.5">
              <Button variant="brand" size="lg" to="/report">
                <PlusIcon className="size-5" /> {t('Report an issue')}
              </Button>
              <Button variant="outline-light" size="lg" to="/map">
                {t('Explore the map')} <ArrowRightIcon className="size-[18px]" />
              </Button>
            </div>

            <ul className="mt-7 flex max-w-[560px] flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-page">
              {perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2">
                  <CheckIcon className="size-4 text-brand" />
                  {t(perk)}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}