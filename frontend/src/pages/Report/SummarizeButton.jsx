import { useRef, useState } from 'react'
import {
  SUMMARIZE_TEXT_MAX,
  SUMMARIZE_TEXT_MIN,
  assistErrorMessage,
  canSummarize,
  getReportSummary,
} from '../../services/assistApi'
import { useT } from '../../i18n/useLanguage'

const IDLE = { status: 'idle' }

const primaryButton =
  'min-h-11 shrink-0 rounded-full bg-ink px-5 py-2 font-body text-xs font-bold text-paper transition hover:bg-ink/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100'
const quietButton =
  'min-h-11 shrink-0 rounded-full border-2 border-navy/20 bg-white px-5 py-2 font-body text-xs font-bold text-navy transition hover:border-navy active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100'

// F8 on the report form: turns the description into a one-line summary (at most
// 70 characters) that can be used as the report title. It only suggests; the
// title changes when the citizen presses the "use" button, and a failure never
// blocks the report.
//
//   text      the description typed so far
//   onUse     onUse(summary), so the form puts it in its own title field
//   label     the text of the "use" button
//   disabled  true while the form is locked
export default function SummarizeButton({
  text = '',
  onUse,
  label = 'Use as title',
  disabled = false,
}) {
  const t = useT()
  const [state, setState] = useState(IDLE)
  const latest = useRef(0)

  const trimmed = text.trim()
  // A summary belongs to the text it was made from. Once the description changes
  // or is cleared (after sending, for example) the old summary is no longer shown.
  const view = state.text === trimmed ? state : IDLE
  const busy = view.status === 'loading'
  const ready = canSummarize(trimmed)
  const canAsk = ready && !disabled && !busy

  async function ask() {
    if (!canAsk) return
    const id = ++latest.current
    const show = (next) => {
      // An older answer must not overwrite a newer one.
      if (id === latest.current) setState({ ...next, text: trimmed })
    }
    show({ status: 'loading' })
    try {
      const summary = await getReportSummary(trimmed.slice(0, SUMMARIZE_TEXT_MAX))
      show({ status: 'done', summary })
    } catch (error) {
      show({ status: 'error', message: assistErrorMessage(error) })
    }
  }

  function use() {
    onUse?.(view.summary)
    setState({ status: 'applied', text: trimmed })
  }

  return (
    <div className="flex flex-col gap-2" aria-busy={busy}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={ask}
          disabled={!canAsk}
          aria-describedby={ready ? undefined : 'summarize-hint'}
          className={quietButton}
        >
          {busy ? t('Writing a short title…') : t('Suggest a short title')}
        </button>
        {!ready && (
          <p id="summarize-hint" className="font-body text-xs text-muted">
            {t('Write at least {min} characters first.', { min: SUMMARIZE_TEXT_MIN })}
          </p>
        )}
      </div>

      <div aria-live="polite">
        {view.status === 'done' && (
          <div className="flex flex-col gap-3 rounded-xl bg-mint/70 p-3">
            <p className="font-body text-sm leading-relaxed text-navy">
              <span className="font-bold">{t('Suggested:')} </span>
              {view.summary}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={use} disabled={disabled} className={primaryButton}>
                {t(label)}
              </button>
              <button type="button" onClick={() => setState(IDLE)} className={quietButton}>
                {t('No thanks')}
              </button>
            </div>
          </div>
        )}
        {view.status === 'applied' && (
          <p className="font-body text-xs font-semibold text-accent">{t('Added. You can still change it.')}</p>
        )}
      </div>

      {view.status === 'error' && (
        <p role="alert" className="font-body text-xs font-semibold text-alert">
          {t(view.message)}
        </p>
      )}
    </div>
  )
}
