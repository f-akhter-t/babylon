// src/pages/Home/MapPreviewSection.jsx
import Button from '../../components/ui/Button'
import Reveal from '../../components/ui/Reveal'
import PreviewMap from './PreviewMap'
import { ArrowRightIcon } from './HomeIcons'
import { useNumber, useT } from '../../i18n/useLanguage'

const legend = [
  { color: 'bg-amber', text: 'Open', key: 'open' },
  { color: 'bg-forest', text: 'In progress', key: 'progress' },
  { color: 'bg-danger', text: 'Reopened', key: 'reopened' },
]

// Same rule the pins use.
function kind(issue) {
  if (issue.priority === 'reopened') return 'reopened'
  if (issue.status === 'in-progress') return 'progress'
  return 'open'
}

export default function MapPreviewSection({ issues }) {
  const t = useT()
  // Only problems that still need work. Max 10 pins so the map stays clear.
  const n = useNumber()
  const active = (issues ?? []).filter((i) => i.status !== 'resolved').slice(0, 10)
  const counts = active.reduce((sum, i) => ({ ...sum, [kind(i)]: (sum[kind(i)] ?? 0) + 1 }), {})
  return (
    <section className="px-5 pt-16 md:px-10 xl:px-18">
      <Reveal>
        {/* No padding on the card. The text block has its own padding, so the map can touch the edges. */}
        <div className="relative overflow-hidden rounded-hero bg-forest xl:flex xl:min-h-[520px] xl:items-center">
          {/* Text: left side, never goes under the map */}
          <div className="p-6 md:p-10 xl:w-[42%] xl:py-16 xl:pl-14 xl:pr-8">
            <p className="text-[13px] font-bold uppercase tracking-widest text-brand">
              {t('Around you')}
            </p>
            <h2 className="mt-2 font-heading text-4xl font-extrabold leading-[1.02] tracking-[-0.03em] text-frost md:text-5xl">
              {t('Already reported? Upvote it.')}
            </h2>
            <p className="mt-4 max-w-[420px] text-lg leading-normal text-frost">
              {t('See what is broken near you. Already on the map? Upvote it instead of reporting it again.')}
            </p>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-frost">
              {legend.map((item) => (
                <li key={item.text} className="flex items-center gap-2">
                  <span className={`size-3 rounded-full border-2 border-paper ${item.color}`} />
                  {n(counts[item.key] ?? 0)} {t(item.text)}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-frost/70">{t('Tap a pin to see the report.')}</p>

            <div className="mt-7">
              <Button variant="outline-light" to="/map">
                {t('Open full map')} <ArrowRightIcon className="size-4" />
              </Button>
            </div>
          </div>

          {/* Map: under the text below 1280 px, right 60% of the card from 1280 px up */}
          <PreviewMap
            issues={active}
          
            className="rounded-none! xl:absolute xl:inset-y-0 xl:right-0 xl:aspect-auto xl:w-[60%]"
          />
        </div>
      </Reveal>
    </section>
  )
}