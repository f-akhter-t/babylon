import { useCallback, useEffect, useRef } from 'react'
import clsx from 'clsx'
import Button from '../../components/ui/Button'
import { animate, RISE_IN, SPRING } from './motion'

const TITLES = {
  upvote: 'Log in to upvote',
  follow: 'Log in to follow',
  report: 'Log in to report',
}

const REASONS = {
  upvote: 'Upvotes show the city which problems matter most.',
  follow: 'Get an alert every time this issue changes.',
  report: 'Your reports are saved to your account so you can track them.',
}

// Small box asking a logged-out visitor to log in. Closes with × or Escape,
// and then focus goes back to the button that opened it.
// action: 'upvote' | 'follow' | 'report'
export default function LoginPrompt({ action, onClose, className }) {
  const boxRef = useRef(null)
  const loginRef = useRef(null)
  const openerRef = useRef(null) // the button that opened this box

  // Pop in, and move keyboard focus to "Log in".
  useEffect(() => {
    // Remember the opener first. Only once: in development the effect runs
    // twice, and the second time focus is already on "Log in".
    if (!openerRef.current) openerRef.current = document.activeElement
    animate(boxRef.current, RISE_IN, { duration: 300, easing: SPRING })
    loginRef.current?.focus({ preventScroll: true }) // don't let the browser shift the map
  }, [])

  // × and Escape: close, then put focus back where it was.
  const close = useCallback(() => {
    const opener = openerRef.current
    onClose()
    if (opener?.isConnected && opener !== document.body) opener.focus({ preventScroll: true })
  }, [onClose])

  // Escape closes only this box. Listening in the "capture" phase runs first,
  // and stopPropagation keeps the page's own Escape (close popup) from running too.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      close()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [close])

  return (
    <div
      ref={boxRef}
      role="dialog"
      aria-label={TITLES[action]}
      className={clsx(
        'relative flex flex-col gap-2 rounded-tile border-2 border-navy bg-mint p-3 pr-9 font-body text-navy shadow-lg',
        className,
      )}
    >
      {/* A 44px tap area around the same small circle (centre unchanged). */}
      <button
        type="button"
        onClick={close}
        aria-label="Close"
        className="group absolute -right-0.5 -top-0.5 flex size-11 items-center justify-center rounded-full text-lg leading-none text-slate hover:text-navy"
      >
        <span className="flex size-7 items-center justify-center rounded-full group-hover:bg-mint-deep">
          ×
        </span>
      </button>
      <span className="font-heading text-base font-extrabold leading-tight">{TITLES[action]}</span>
      <span className="text-xs text-slate">{REASONS[action]}</span>
      <div className="mt-1 flex gap-2">
        {/* "!" colours beat Leaflet's blue link colour inside map popups */}
        <Button ref={loginRef} to="/login" variant="dark" className="flex-1 text-white!">
          Log in
        </Button>
        <Button to="/signup" variant="outline" className="flex-1 text-navy!">
          Sign up
        </Button>
      </div>
    </div>
  )
}
