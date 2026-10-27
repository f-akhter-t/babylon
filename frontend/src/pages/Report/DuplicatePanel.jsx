import { useEffect, useState } from 'react'
import { resizeImage } from '../../utils/resizeImage'
import { checkDuplicates } from '../../services/duplicatesApi'
import { upvoteIssue } from '../../services/api'
import { useT } from '../../i18n/useLanguage'

const quietButton =
  'min-h-11 shrink-0 rounded-full border-2 border-navy/20 bg-white px-5 py-2 font-body text-xs font-bold text-navy transition hover:border-navy active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100'

const placeLabel = (location) =>
  typeof location === 'string' ? location : (location?.label ?? '')

// F2 on the report form: when a photo is chosen, look for similar open reports
// in the citizen's division. It only suggests. A failure or CLIP being off shows
// nothing and never blocks the report.
//
//   photo     the chosen photo (a File), or null
//   disabled  true while the form is locked
export default function DuplicatePanel({ photo, disabled = false }) {
  const t = useT()
  // { photo, matches } for the photo it was made for
  const [state, setState] = useState(null)
  // per match id: { status: 'busy' | 'done' | 'closed' | 'error', votes?, message? }
  const [support, setSupport] = useState({})

  useEffect(() => {
    if (!photo || disabled) return undefined
    let cancelled = false
    async function run() {
      let matches = []
      try {
        const photoUrl = await resizeImage(photo)
        const result = await checkDuplicates(photoUrl)
        matches = result.checked ? result.matches : []
      } catch {
        // the check never blocks the report
      }
      if (!cancelled) setState({ photo, matches })
    }
    run()
    return () => {
      cancelled = true
    }
  }, [photo, disabled])

  async function supportIssue(id) {
    setSupport((s) => ({ ...s, [id]: { status: 'busy' } }))
    try {
      const votes = await upvoteIssue(id)
      setSupport((s) => ({
        ...s,
        [id]: votes === null ? { status: 'closed' } : { status: 'done', votes },
      }))
    } catch (error) {
      setSupport((s) => ({
        ...s,
        [id]: { status: 'error', message: error?.message || t('Please try again.') },
      }))
    }
  }

  if (!photo || disabled) return null

  const view = state?.photo === photo ? state : null
  if (!view) {
    return (
      <p aria-live="polite" className="font-body text-xs text-muted">
        {t('Checking for similar reports in your division…')}
      </p>
    )
  }
  if (view.matches.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="flex flex-col gap-3 rounded-2xl border border-forest/25 bg-white/70 p-4"
    >
      <div>
        <p className="font-body text-sm font-bold text-navy">{t('Is this already reported?')}</p>
        <p className="font-body text-xs text-muted">
          {t('We found similar photos in your division. If it is the same problem, support that report instead of filing a new one.')}
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {view.matches.map((m) => {
          const s = support[m.id]
          return (
            <li key={m.id} className="flex items-center gap-3 rounded-xl bg-mint/70 p-3">
              {m.beforeImg && (
                <img src={m.beforeImg} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-sm font-bold text-navy">{m.title}</p>
                <p className="truncate font-body text-xs text-muted">
                  {[t(m.category), placeLabel(m.location), t('{percent}% similar', { percent: Math.round(m.similarity * 100) })]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                {s?.status === 'done' && (
                  <p className="font-body text-xs font-semibold text-forest">
                    {t('Thanks, your support was added ({votes} in total).', { votes: s.votes })}
                  </p>
                )}
                {s?.status === 'closed' && (
                  <p className="font-body text-xs font-semibold text-danger">
                    {t('You already supported this one, or it is closed.')}
                  </p>
                )}
                {s?.status === 'error' && (
                  <p role="alert" className="font-body text-xs font-semibold text-danger">
                    {s.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => supportIssue(m.id)}
                disabled={s?.status === 'busy' || s?.status === 'done'}
                className={quietButton}
              >
                {s?.status === 'busy' ? t('Adding…') : t('Support this one instead')}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
