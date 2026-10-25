import { useRef, useState } from 'react'
import { resizeImage } from '../../utils/resizeImage'
import { assistErrorMessage, getReportSuggestion } from '../../services/assistApi'

const IDLE = { status: 'idle' }

const primaryButton =
  'min-h-11 shrink-0 rounded-full bg-navy px-5 py-2 font-body text-xs font-bold text-white transition hover:bg-navy/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100'
const quietButton =
  'min-h-11 shrink-0 rounded-full border-2 border-navy/20 bg-white px-5 py-2 font-body text-xs font-bold text-navy transition hover:border-navy active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100'

// F6 on the report form: the assistant looks at the photo and suggests a category
// and a description. It only suggests; nothing changes in the form until the
// citizen presses "Use this suggestion", and a failure never blocks the report.
//
//   photo        the chosen photo (a File), or null
//   category     the category already picked, or ''. It is sent to the assistant
//                and is never replaced by the suggestion.
//   description  what is already typed. Only used to warn that it will be replaced.
//   disabled     true while the form is locked
//   onApply      onApply({ category, description }), so the form fills its own
//                fields. category is null when the assistant could not tell, or
//                when the citizen had already picked one.
export default function AssistPanel({
  photo,
  category = '',
  description = '',
  disabled = false,
  onApply,
}) {
  const [state, setState] = useState(IDLE)
  const latest = useRef(0)

  // A suggestion belongs to the photo it was made for. When the photo is changed
  // or removed, or the form is cleared after sending, the panel starts over.
  const view = state.photo === photo ? state : IDLE
  const busy = view.status === 'loading'
  const canAsk = Boolean(photo) && !disabled && !busy

  async function ask() {
    if (!canAsk) return
    const id = ++latest.current
    const forPhoto = photo
    const show = (next) => {
      // An older answer must not overwrite a newer one.
      if (id === latest.current) setState({ ...next, photo: forPhoto })
    }
    show({ status: 'loading' })

    let photoUrl
    try {
      photoUrl = await resizeImage(forPhoto)
    } catch (error) {
      show({ status: 'error', message: error?.message || 'We could not read that photo. Please try a different one.' })
      return
    }

    try {
      const suggestion = await getReportSuggestion({ photoUrl, category })
      show({ status: 'done', suggestion })
    } catch (error) {
      show({ status: 'error', message: assistErrorMessage(error) })
    }
  }

  function use() {
    const { suggestion } = view
    onApply?.({
      category: category ? null : suggestion.category,
      description: suggestion.description,
    })
    setState({ status: 'applied', photo })
  }

  const suggestion = view.status === 'done' ? view.suggestion : null
  const replaces = description.trim().length > 0

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-forest/25 bg-white/70 p-4"
      aria-busy={busy}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-body text-sm font-bold text-navy">Not sure what to write?</p>
          <p className="font-body text-xs text-muted">
            The assistant looks at your photo and suggests a category and a description. You can change
            them before you submit.
          </p>
        </div>
        <button type="button" onClick={ask} disabled={!canAsk} className={primaryButton}>
          {busy ? 'Looking at your photo…' : 'Suggest from my photo'}
        </button>
      </div>

      {!photo && (
        <p className="font-body text-xs text-muted">Add a photo first and the assistant can look at it.</p>
      )}

      <div aria-live="polite" className="flex flex-col gap-3">
        {suggestion && (
          <div className="flex flex-col gap-3 rounded-xl bg-mint/70 p-3">
            {!category && (
              <p className="font-body text-xs text-navy">
                <span className="font-bold">Category: </span>
                {suggestion.category ?? 'The assistant could not tell. Please choose one yourself.'}
              </p>
            )}
            <p className="font-body text-sm leading-relaxed text-navy">
              <span className="sr-only">Description: </span>
              {suggestion.description}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={use} disabled={disabled} className={primaryButton}>
                {replaces ? 'Replace my description' : 'Use this suggestion'}
              </button>
              <button type="button" onClick={() => setState(IDLE)} className={quietButton}>
                No thanks
              </button>
            </div>
          </div>
        )}
        {view.status === 'applied' && (
          <p className="font-body text-xs font-semibold text-forest">
            Added to your report. You can still change it.
          </p>
        )}
      </div>

      {view.status === 'error' && (
        <p role="alert" className="font-body text-xs font-semibold text-danger">
          {view.message}
        </p>
      )}
    </div>
  )
}
