import { useEffect, useRef } from 'react'
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

// Small box asking a logged-out visitor to log in. Closes with × or Escape.
// action: 'upvote' | 'follow' | 'report'
export default function LoginPrompt({ action, onClose, className }) {
  const boxRef = useRef(null)
  const loginRef = useRef(null)

  // Pop in, and move keyboard focus to "Log in".
  useEffect(() => {
    animate(boxRef.current, RISE_IN, { duration: 300, easing: SPRING })
    loginRef.current?.focus()
  }, [])

  // Escape closes only this box. Listening in the "capture" phase runs first,
  // and stopPropagation keeps the page's own Escape (close popup) from running too.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

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
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full text-lg leading-none text-slate hover:bg-mint-deep hover:text-navy"
      >
        ×
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
