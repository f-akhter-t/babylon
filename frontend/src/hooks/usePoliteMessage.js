import { useCallback, useEffect, useRef, useState } from 'react'

const SPEAK_DELAY_MS = 60 // cleared first, so the same sentence is read again
const CLEAR_AFTER_MS = 6000 // then it goes, so no old sentence sits in the page

// A sentence for a polite live region (role="status"), for live updates such
// as "This report is now In progress."
//   const [message, say] = usePoliteMessage()
//   <p role="status" className="sr-only">{message}</p>
export function usePoliteMessage() {
  const [message, setMessage] = useState('')
  const timers = useRef([])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const say = useCallback((text) => {
    timers.current.forEach(clearTimeout)
    setMessage('')
    timers.current = [
      setTimeout(() => setMessage(text), SPEAK_DELAY_MS),
      setTimeout(() => setMessage(''), SPEAK_DELAY_MS + CLEAR_AFTER_MS),
    ]
  }, [])

  return [message, say]
}
