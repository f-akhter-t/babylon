import { useEffect, useRef } from 'react'
import { dismissError, dismissInfo, updateClearance, useToastState } from './toast'

// Shows the toasts raised with useToast() (see toast.js): a navy pill at the
// bottom centre, above any bar marked with data-toast-clearance.

const INFO_MS = 4000
const GAP_PX = 12 // space between a toast and a bar it has to clear

const pill =
  'pointer-events-auto w-max max-w-[calc(100vw-2rem)] rounded-full bg-navy text-center font-body text-sm font-semibold text-white shadow-lg motion-safe:animate-toast-in'

// Info toasts leave after INFO_MS. The timer pauses while the pointer is over the toast.
function useAutoDismiss(info) {
  const timer = useRef(0)
  const left = useRef(INFO_MS)
  const startedAt = useRef(0)
  const id = info?.id

  function start() {
    clearTimeout(timer.current)
    startedAt.current = Date.now()
    timer.current = setTimeout(() => dismissInfo(id), left.current)
  }
  function pause() {
    clearTimeout(timer.current)
    left.current = Math.max(500, left.current - (Date.now() - startedAt.current))
  }

  useEffect(() => {
    if (!id) return
    left.current = INFO_MS
    start()
    return () => clearTimeout(timer.current)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps -- restart only for a new toast

  return { onPointerEnter: pause, onPointerLeave: start }
}

export default function Toaster() {
  const { info, errors, spoken, clearance } = useToastState()
  const showing = Boolean(info) || errors.length > 0
  const hover = useAutoDismiss(info)

  // While a toast shows, keep it clear of bars that move into view.
  useEffect(() => {
    if (!showing) return
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(updateClearance)
    }
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [showing])

  const bottom = clearance
    ? `${clearance + GAP_PX}px`
    : 'calc(1.5rem + env(safe-area-inset-bottom))'

  return (
    <>
      {/* Always in the page, so screen readers are listening before a toast arrives. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {spoken}
      </div>

      <div
        className="pointer-events-none fixed inset-x-0 z-[1200] flex flex-col items-center gap-2 px-4"
        style={{ bottom }}
      >
        {/* Errors: their own alert region, read once, kept until dismissed. */}
        <div role="alert" className="flex flex-col items-center gap-2">
          {errors.map((error) => (
            <div key={error.id} className={`${pill} flex items-center gap-3 py-1.5 pl-5 pr-1.5 text-left`}>
              <span>{error.text}</span>
              <button
                type="button"
                aria-label="Dismiss this message"
                onClick={() => dismissError(error.id)}
                className="min-h-11 shrink-0 rounded-full border border-mint/40 px-4 font-bold text-mint transition-colors hover:bg-mint/10 motion-reduce:transition-none"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>

        {/* The info toast is for the eyes; the live region above reads it out. */}
        {info && (
          <div key={info.id} aria-hidden="true" className={`${pill} px-5 py-2.5`} {...hover}>
            {info.text}
          </div>
        )}
      </div>
    </>
  )
}
