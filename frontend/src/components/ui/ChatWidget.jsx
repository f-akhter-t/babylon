import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { getSession } from '../../services/auth'
import { sendChat } from '../../services/extraApi'
import { useT } from '../../i18n/useLanguage'

const GREETING = 'Hi! Ask me how to report a problem, how votes work, or what a status means.'
const SUGGESTIONS = ['How do I report a problem?', 'How do points work?', 'What do the statuses mean?']
const MAX_HISTORY = 6 // the server keeps the last 6 turns

function TypingDots() {
  const t = useT()
  return (
    <div
      className="flex w-fit items-center gap-1 self-start rounded-[18px] rounded-bl-md bg-mint px-4 py-3"
      role="status"
      aria-label={t('The helper is typing')}
    >
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-2 w-2 rounded-full bg-ink/50 motion-safe:animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  )
}

// Floating helper for citizens (F4). Mounted once in App.jsx, outside the routes.
// Guests, departments and admins never see it.
export default function ChatWidget() {
  const t = useT()
  const { pathname } = useLocation()
  // Read on every render, not once: this widget stays mounted across pages, so a
  // login or logout (which always changes the page) must show or hide it at once.
  const isCitizen = getSession()?.role === 'citizen'
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([]) // { role: 'user' | 'assistant', text }
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const launcherRef = useRef(null)
  const endRef = useRef(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, busy, error])

  useEffect(() => {
    if (!open) return
    const onKey = (event) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      launcherRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!isCitizen) return null

  async function ask(text) {
    const question = text.trim()
    if (!question || busy) return
    const history = messages.slice(-MAX_HISTORY)
    setMessages([...messages, { role: 'user', text: question }])
    setDraft('')
    setError('')
    setBusy(true)
    try {
      const { reply } = await sendChat(question, history)
      setMessages((list) => [...list, { role: 'assistant', text: reply }])
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function submit(event) {
    event.preventDefault()
    ask(draft)
  }

  function newChat() {
    setMessages([])
    setError('')
    setDraft('')
    inputRef.current?.focus()
  }

  function close() {
    setOpen(false)
    launcherRef.current?.focus()
  }

  // The map has its own floating "Report an issue" button in the corner.
  const onMap = pathname.startsWith('/map')

  return (
    <>
      {/* Always mounted so it can fade and slide. While closed it is invisible,
          so it can not be clicked or tabbed into. */}
      <section
        role="dialog"
        aria-label={t('Babylon helper')}
        aria-hidden={!open}
        className={clsx(
          'fixed right-4 z-40 flex h-[480px] max-h-[calc(100vh-7rem)] w-[372px] max-w-[calc(100vw-2rem)] origin-bottom-right flex-col overflow-hidden rounded-card bg-white shadow-2xl ring-1 ring-navy/10',
          'transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none',
          onMap ? 'bottom-40' : 'bottom-20',
          open ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible translate-y-3 scale-95 opacity-0',
        )}
      >
        <header className="flex items-center gap-3 bg-ink px-4 py-3 text-frost">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand font-heading text-lg font-extrabold text-ink"
          >
            B
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-lg font-extrabold leading-tight">{t('Babylon helper')}</h2>
            <p className="font-body text-xs text-frost/70">{t('Ask how the app works')}</p>
          </div>
          <button
            type="button"
            onClick={newChat}
            disabled={messages.length === 0 && !error}
            aria-label={t('Start a new chat')}
            className="rounded-full px-3 py-1.5 font-body text-xs font-semibold transition-colors hover:bg-paper/10 disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {t('New chat')}
          </button>
          <button
            type="button"
            aria-label={t('Close helper')}
            onClick={close}
            className="grid h-8 w-8 place-items-center rounded-full text-lg transition-colors hover:bg-paper/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            ✕
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto bg-white px-3 py-4" role="log" aria-live="polite">
          <p className="max-w-[85%] self-start rounded-[18px] rounded-bl-md bg-mint px-3.5 py-2.5 font-body text-sm text-navy">
            {t(GREETING)}
          </p>

          {messages.length === 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
              {SUGGESTIONS.map((text) => (
                <button
                  key={text}
                  type="button"
                  disabled={busy}
                  onClick={() => ask(t(text))}
                  className="rounded-full border border-navy/30 px-3 py-1.5 text-left font-body text-xs font-semibold text-navy transition-colors hover:border-navy hover:bg-mint disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {t(text)}
                </button>
              ))}
            </div>
          )}

          {messages.map((m, i) => (
            <p
              key={i}
              className={clsx(
                'max-w-[85%] whitespace-pre-line rounded-[18px] px-3.5 py-2.5 font-body text-sm',
                m.role === 'user'
                  ? 'self-end rounded-br-md bg-forest text-frost'
                  : 'self-start rounded-bl-md bg-mint text-navy',
              )}
            >
              {m.text}
            </p>
          ))}

          {busy && <TypingDots />}

          {error && (
            <p role="alert" className="max-w-[85%] self-start rounded-[18px] rounded-bl-md bg-amber/25 px-3.5 py-2.5 font-body text-sm text-navy">
              {error}
            </p>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={submit} className="flex items-center gap-2 border-t border-mint-deep bg-white px-3 py-3">
          <label className="sr-only" htmlFor="babylon-chat-input">{t('Your question')}</label>
          <input
            id="babylon-chat-input"
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={500}
            placeholder={t('Ask about Babylon')}
            autoComplete="off"
            className="min-w-0 flex-1 rounded-full border-[1.5px] border-soft/40 px-4 py-2 font-body text-sm text-navy outline-none transition-colors placeholder:text-muted focus:border-navy"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            aria-label={t('Send')}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-frost transition-colors enabled:hover:bg-forest disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </form>
      </section>

      {/* The floating motion: the button drifts up and down all the time, and stops while
          the pointer is on it or the helper is open. Only a layer INSIDE the button moves.
          The button itself stays put, so the hit area never slides away from the pointer.
          Change -8px for how high it rises and 2.4s for how fast. */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes babylon-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
          .babylon-float { animation: babylon-float 2.4s ease-in-out infinite; }
        }
      `}</style>
      <button
        ref={launcherRef}
        type="button"
        aria-expanded={open}
        aria-label={open ? t('Close the Babylon helper') : t('Open the Babylon helper')}
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'group fixed right-4 z-40 h-12 w-12 rounded-full focus-visible:outline-none sm:h-14 sm:w-14',
          onMap ? 'bottom-24' : 'bottom-4',
        )}
      >
        <span
          aria-hidden="true"
          className={clsx(
            'absolute inset-0 grid place-items-center rounded-full bg-ink text-brand shadow-lg transition-[background-color,box-shadow] duration-300 group-hover:bg-forest group-hover:shadow-2xl group-focus-visible:ring-2 group-focus-visible:ring-brand group-focus-visible:ring-offset-2 motion-reduce:transition-none',
            !open && 'babylon-float group-hover:[animation-play-state:paused]',
          )}
        >
          {/* A ring that opens up around the button on hover or keyboard focus. */}
          <span className="pointer-events-none absolute inset-0 scale-100 rounded-full border-2 border-brand opacity-0 transition-all duration-300 group-hover:scale-[1.35] group-hover:opacity-60 group-focus-visible:scale-[1.35] group-focus-visible:opacity-60 motion-reduce:transition-none" />

          {/* The two icons swap places: the old one turns away and shrinks, the new one turns in. */}
          <span className="pointer-events-none relative grid h-6 w-6 place-items-center transition-transform duration-150 group-active:scale-90 motion-reduce:transition-none">
            <svg
              viewBox="0 0 24 24"
              className={clsx(
                'absolute h-6 w-6 transition-all duration-300 ease-out motion-reduce:transition-none',
                open
                  ? 'rotate-90 scale-0 opacity-0'
                  : 'rotate-0 scale-100 opacity-100 group-hover:-rotate-12 group-hover:scale-110',
              )}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
              strokeLinecap="round"
            >
              <path d="M5 5h14v10H10l-5 4z" />
            </svg>
            <svg
              viewBox="0 0 24 24"
              className={clsx(
                'absolute h-6 w-6 transition-all duration-300 ease-out motion-reduce:transition-none',
                open
                  ? 'rotate-0 scale-100 opacity-100 group-hover:rotate-90'
                  : '-rotate-90 scale-0 opacity-0',
              )}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </span>

          {/* A small label slides out to the left. It ignores the pointer. */}
          <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-full bg-ink px-3.5 py-1.5 font-body text-sm font-semibold text-frost opacity-0 shadow-lg transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none">
            {open ? t('Close') : t('Ask Babylon')}
          </span>
        </span>
      </button>
    </>
  )
}
