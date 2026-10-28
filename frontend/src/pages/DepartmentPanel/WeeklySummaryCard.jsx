import { useEffect, useState } from 'react'
import { getWeeklySummary } from '../../services/extraApi'
import { useNumber, useT } from '../../i18n/useLanguage'

const TILES = [
  { key: 'newReports', label: 'New reports' },
  { key: 'started', label: 'Work started' },
  { key: 'resolved', label: 'Fixed' },
  { key: 'open', label: 'Not started' },
  { key: 'awaiting', label: 'Waiting for admin' },
]

// F5. The numbers always show. The written summary shows only when the AI answered.
// Put <WeeklySummaryCard /> in DepartmentPanel.jsx above the issue table.
export default function WeeklySummaryCard() {
  const t = useT()
  const n = useNumber()
  const [state, setState] = useState({ status: 'loading', data: null, message: '' })

  useEffect(() => {
    let active = true
    getWeeklySummary()
      .then((data) => active && setState({ status: 'ready', data, message: '' }))
      .catch((err) => active && setState({ status: 'error', data: null, message: err.message }))
    return () => {
      active = false
    }
  }, [])

  if (state.status === 'loading') {
    return <div className="h-[168px] animate-pulse rounded-card bg-mint/60" aria-label={t('Loading the weekly summary')} />
  }
  if (state.status === 'error') {
    return (
      <p role="alert" className="rounded-card bg-mint px-5 py-4 font-body text-sm text-navy">
        {state.message}
      </p>
    )
  }

  const { data } = state
  return (
    <section className="rounded-card bg-mint p-5" aria-labelledby="weekly-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="weekly-title" className="font-heading text-xl font-extrabold text-navy">
          {t('This week')}
        </h2>
        <span className="font-body text-xs text-muted">{t('Last {days} days', { days: data.days })} · {t(data.department)}</span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {TILES.map((tile) => (
          <div key={tile.key} className="rounded-[14px] bg-white px-3 py-2">
            <dt className="font-body text-xs font-semibold text-muted">{t(tile.label)}</dt>
            <dd className="font-heading text-2xl font-extrabold text-navy">{n(data.counts[tile.key])}</dd>
          </div>
        ))}
      </dl>

      {data.summary && <p className="mt-3 font-body text-sm leading-relaxed text-navy">{data.summary}</p>}

      <p className="mt-3 font-body text-xs text-muted">{t('Longest wait: {days} days', { days: data.counts.longestWaitingDays })}</p>
    </section>
  )
}
