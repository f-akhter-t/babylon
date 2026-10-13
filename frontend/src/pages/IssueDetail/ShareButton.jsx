import { useEffect, useRef, useState } from 'react'
import { ShareIcon } from './DetailIcons'

const MESSAGES = {
  idle: '',
  copied: 'Link copied',
  failed: 'Could not copy. Use the address bar instead.',
}

// Phones and tablets get the system share sheet. Desktop Chrome on Windows
// has one too, but there copying the link is what people expect.
function canUseShareSheet() {
  return typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches
}

// Shares this page's address: the share sheet on touch devices, otherwise
// it copies the link and says so for a few seconds.
export default function ShareButton({ title }) {
  const [state, setState] = useState('idle') // 'idle' | 'copied' | 'failed'
  const timer = useRef(null)

  // Stop the timer if the page closes before it runs.
  useEffect(() => () => clearTimeout(timer.current), [])

  function show(next) {
    setState(next)
    clearTimeout(timer.current)
    if (next !== 'idle') timer.current = setTimeout(() => setState('idle'), 2500)
  }

  async function share() {
    const url = window.location.href
    if (canUseShareSheet()) {
      try {
        await navigator.share({ title, url })
        show('idle') // the phone confirms it itself
        return
      } catch (error) {
        if (error?.name === 'AbortError') {
          show('idle') // the person closed the sheet: say nothing
          return
        }
        // Any other problem: fall back to copying the link.
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      show('copied')
    } catch {
      show('failed') // clipboard blocked or not available
    }
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
        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-2 border-navy/20 bg-white px-3.5 text-sm font-semibold text-navy transition hover:border-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy motion-safe:active:scale-95"
      >
        <ShareIcon size={16} />
        Share
      </button>
    </div>
  )
}
