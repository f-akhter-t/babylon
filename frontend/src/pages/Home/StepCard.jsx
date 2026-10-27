import clsx from 'clsx'
import StaircaseIcon from '../../components/ui/StaircaseIcon'

const tones = {
  mint: {
    card: 'bg-mint',
    icon: 'text-accent',
    number: 'text-accent',
    title: 'text-navy',
    body: 'text-soft',
  },
  forest: {
    card: 'bg-forest',
    icon: 'text-frost',
    number: 'text-brand',
    title: 'text-frost',
    body: 'text-frost',
  },
  navy: {
    card: 'bg-ink',
    icon: 'text-brand',
    number: 'text-brand',
    title: 'text-frost',
    body: 'text-page',
  },
}

export default function StepCard({ number, level, tone, title, text, className, children }) {
  const t = tones[tone]

  return (
    <article
      className={clsx(
        'lift group flex flex-col justify-between gap-6 rounded-panel p-7',
        t.card,
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className="inline-block transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110">
          <StaircaseIcon level={level} className={clsx('h-9 w-10', t.icon)} />
        </span>
        <span
          className={clsx(
            'font-heading text-5xl font-extrabold transition-transform duration-300 group-hover:scale-110',
            t.number,
          )}
        >
          {number}
        </span>
      </div>

      <div>
        <h3
          className={clsx(
            'font-heading text-[32px] font-extrabold tracking-[-0.02em]',
            t.title,
          )}
        >
          {title}
        </h3>
        <p className={clsx('mt-2 text-[15px] leading-normal', t.body)}>{text}</p>
      </div>

      <div>{children}</div>
    </article>
  )
}