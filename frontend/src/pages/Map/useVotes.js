import { useCallback, useEffect, useRef, useState } from 'react'
import { addVote, removeVote } from '../../services/api'

// Votes live on the server. This hook shows the answer to the person's own click
// at once, and steps aside as soon as the list from the server has moved on (the
// next refresh), so the server is always the truth.
//
//   const { withVotes, toggle } = useVotes(issues)
//   withVotes(list)  -> the same issues, with this person's latest vote shown
//   toggle(id)       -> adds or removes the vote; resolves { id, votes, voted },
//                       or null for an unknown id; rejects with the server's message

// `from` is what the server said when the person clicked. While the server still
// says that, the click is shown. Once it says anything else, the server wins.
function applyOne(issue, mine) {
  const own = mine[issue.id]
  if (!own || Boolean(issue.voted) !== own.from) return issue
  return { ...issue, voted: own.voted, votes: own.votes }
}

// Forgets the clicks the server has already moved past.
function prune(mine, issues) {
  const next = {}
  for (const [id, own] of Object.entries(mine)) {
    const issue = issues.find((item) => String(item.id) === id)
    if (!issue || Boolean(issue.voted) === own.from) next[id] = own
  }
  return next
}

export function useVotes(issues) {
  const list = issues ?? []
  const [mine, setMine] = useState({})

  // When what the server says about my votes changes, drop the clicks it has
  // moved past. A text signature (not the array) is compared, because callers
  // build a new array on every render.
  const signature = list.map((item) => `${item.id}:${item.voted ? 1 : 0}`).join(',')
  const [seen, setSeen] = useState(signature)
  if (signature !== seen) {
    setSeen(signature)
    setMine((current) => prune(current, list))
  }

  const latest = useRef({ issues: [], mine: {} })
  useEffect(() => {
    latest.current = { issues: list, mine }
  })

  const withVotes = useCallback((items) => items.map((issue) => applyOne(issue, mine)), [mine])

  const toggle = useCallback(async (id) => {
    const { issues: current, mine: own } = latest.current
    const issue = current.find((item) => String(item.id) === String(id))
    if (!issue) return null
    const shown = applyOne(issue, own)
    const answer = shown.voted ? await removeVote(id) : await addVote(id)
    setMine((before) => ({
      ...before,
      [issue.id]: { from: Boolean(issue.voted), voted: answer.voted, votes: answer.votes },
    }))
    return answer
  }, [])

  return { withVotes, toggle }
}
