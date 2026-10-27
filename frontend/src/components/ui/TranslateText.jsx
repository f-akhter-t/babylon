import { useState } from 'react'
import { getToken } from '../../services/http'
import { TRANSLATE_LANGUAGES, translateText } from '../../services/api'
import { useLanguage, useT } from '../../i18n/useLanguage'

// Report text with a small "Translate" control under it. Only for signed-in people
// (the server needs a token). The original text is never replaced for good: the
// translation shows below it, and "Show original" hides it again.
export default function TranslateText({ text, className = '' }) {
  const t = useT()
  const { lang } = useLanguage()
  // A reader on the Bangla site most likely wants the report in Bangla.
  const [to, setTo] = useState(lang === 'bn' ? 'bn' : TRANSLATE_LANGUAGES[0].code)
  const [state, setState] = useState({ status: 'idle' })

  async function run() {
    setState({ status: 'loading' })
    try {
      const result = await translateText(text, to)
      setState({ status: 'done', translation: result.translation })
    } catch (error) {
      setState({ status: 'error', message: error.message })
    }
  }

  const signedIn = Boolean(getToken())

  return (
    <div className={className}>
      <p className="leading-relaxed text-navy">{text}</p>
      {signedIn && text && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <label htmlFor="translate-to" className="font-semibold text-slate">
            {t('Translate to')}
          </label>
          <select
            id="translate-to"
            value={to}
            onChange={(event) => {
              setTo(event.target.value)
              setState({ status: 'idle' })
            }}
            className="rounded-full border-2 border-navy bg-white px-3 py-1 text-navy"
          >
            {TRANSLATE_LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>
                {language.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={run}
            disabled={state.status === 'loading'}
            className="rounded-full bg-navy px-4 py-1 font-semibold text-white transition hover:bg-navy/90 disabled:opacity-50"
          >
            {state.status === 'loading' ? t('Translating…') : t('Translate')}
          </button>
          {state.status === 'done' && (
            <button
              type="button"
              onClick={() => setState({ status: 'idle' })}
              className="font-semibold text-forest underline"
            >
              {t('Show original only')}
            </button>
          )}
        </div>
      )}
      <div aria-live="polite">
        {state.status === 'done' && (
          <p lang={to} className="mt-2 rounded-tile bg-mint/60 p-3 leading-relaxed text-navy">
            {state.translation}
          </p>
        )}
        {state.status === 'error' && (
          <p role="alert" className="mt-2 text-sm font-semibold text-red-700">
            {t(state.message)}
          </p>
        )}
      </div>
    </div>
  )
}
