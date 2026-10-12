import { useEffect, useState } from 'react'

const WIDE = '(min-width: 768px)'

// Video only on wide screens, and never when Data Saver is on.
function check() {
  const saveData = navigator.connection?.saveData === true
  return window.matchMedia(WIDE).matches && !saveData
}

export default function useVideoAllowed() {
  const [allowed, setAllowed] = useState(check)

  useEffect(() => {
    const mq = window.matchMedia(WIDE)
    const update = () => setAllowed(check())
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return allowed
}