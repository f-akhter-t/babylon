import { useEffect, useRef, useState } from 'react'
import { ShareIcon } from './DetailIcons'

const MESSAGES = {
  idle: '',
  copied: 'Link copied',
  failed: 'Could not copy. Use the address bar instead.',
}

// Copies this page's address, then says so for a few seconds.
export default function ShareButton() {
  const [state, setState] = useState('idle') // 'idle' | 'copied' | 'failed'
  const timer = useRef(null)

  // Stop the timer if the page closes before it runs.
  useEffect(() => () => clearTimeout(timer.current), [])

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setState('copied')
    } catch {
      setState('failed') // clipboard blocked or not available
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 2500)
  }

  return (
    <div className="flex items-center gap-2">
      {/* role="status": screen readers announce the message when it changes */}
      <span role="status" className="text-right text-xs font-semibold text-forest">
        {MESSAGES[state]}
      </span>
      <button
        type="button"
        onClick={share}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-navy/20 bg-white px-3.5 py-1.5 text-sm font-semibold text-navy transition hover:border-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy motion-safe:active:scale-95"
      >
        <ShareIcon size={16} />
        Share
      </button>
    </div>
  )
}
