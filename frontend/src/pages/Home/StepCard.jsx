import clsx from 'clsx'
import StaircaseIcon from '../../components/ui/StaircaseIcon'

const tones = {
  mint: {
    card: 'bg-mint',
    icon: 'text-forest',
    number: 'text-forest',
    title: 'text-navy',
    body: 'text-slate',
  },
  forest: {
    card: 'bg-forest',
    icon: 'text-mint',
    number: 'text-brand',
    title: 'text-mint',
    body: 'text-white/80',
  },
  navy: {
    card: 'bg-navy',
    icon: 'text-brand',
    number: 'text-brand',
    title: 'text-mint',
    body: 'text-white/70',
  },
}

export default function StepCard({ number, level, tone, title, text, className, children }) {
  const t = tones[tone]

  return (
    <article className={clsx('flex flex-col rounded-panel p-7', t.card, className)}>
      <div className="flex items-start justify-between">
        <StaircaseIcon level={level} className={clsx('h-9 w-10', t.icon)} />
        <span className={clsx('font-heading text-5xl font-extrabold', t.number)}>
          {number}
        </span>
      </div>
      <h3 className={clsx('mt-6 font-heading text-3xl font-extrabold', t.title)}>{title}</h3>
      <p className={clsx('mt-2 max-w-sm', t.body)}>{text}</p>
      <div className="mt-auto pt-6">{children}</div>
    </article>
  )
}