import { useEffect, useState } from 'react'
import { getIdentityPhoto } from '../../services/api'

// Loads the card photo of one submission for the review panel.
//   const photo = useIdentityPhoto(submission)
//   photo.kind: 'loading' | 'sample' | 'photo' | 'missing' | 'error'
//   photo.url:  a temporary address for <img> (kind 'photo' only)
//   photo.retry(): try loading again (after 'error')
// The temporary address is freed when the submission changes or the panel closes.
export function useIdentityPhoto(submission) {
  const { id, email, submittedAt, sample } = submission
  const [attempt, setAttempt] = useState(0)
  const key = `${id}|${submittedAt}|${attempt}`
  const [result, setResult] = useState({ key: null, kind: 'loading', url: null })

  useEffect(() => {
    let ignore = false
    let url = null
    getIdentityPhoto({ id, email, submittedAt, sample }).then((photo) => {
      if (ignore) return
      if (photo.kind === 'photo') url = URL.createObjectURL(photo.blob)
      setResult({ key, kind: photo.kind, url })
    })
    return () => {
      ignore = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [key, id, email, submittedAt, sample])

  const current = result.key === key
  return {
    kind: current ? result.kind : 'loading',
    url: current ? result.url : null,
    retry: () => setAttempt((n) => n + 1),
  }
}
