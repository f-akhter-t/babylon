import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import clsx from 'clsx'
import AdminLayout from '../../components/layout/AdminLayout'
import FormNotice from '../Profile/FormNotice'
import IdentityQueueCard, { QueueSkeleton } from './IdentityQueueCard'
import IdentityReviewPanel from './IdentityReviewPanel'
import { useViewer } from '../Map/useViewer'
import { useDocumentTitle } from '../IssueDetail/useDocumentTitle'
import { getIdentityQueue, PROFILE_EVENT, reviewIdentity } from '../../services/api'

// A submission is the same one only while its date matches, so a citizen who
// sends again after a rejection shows up as a fresh card.
const keyOf = (submission) => `${submission.id}|${submission.submittedAt}`

const ALREADY_REVIEWED = 'This submission was already reviewed.'

// Only admins review identities. Everyone else goes to the login page.
export default function IdentityReview() {
  const viewer = useViewer()
  if (viewer.role !== 'admin') return <Navigate to="/login" replace />
  return <IdentityReviewPage />
}

function IdentityReviewPage() {
  useDocumentTitle('Identity checks')
  const [queue, setQueue] = useState(null) // null while loading
  const [selectedKey, setSelectedKey] = useState(null)
  const [notice, setNotice] = useState(null) // { tone, text }
  const [focusPanel, setFocusPanel] = useState(false)
  const panelRef = useRef(null)
  const listRef = useRef(null)

  const load = useCallback(() => {
    let ignore = false
    getIdentityQueue()
      .then((list) => {
        if (ignore) return
        setQueue(list)
        // Start on the first card. Kept by key, so if it disappears we can say why.
        setSelectedKey((current) => current ?? (list[0] ? keyOf(list[0]) : null))
      })
      .catch(() => {
        if (!ignore) {
          setQueue((current) => current ?? [])
          setNotice({ tone: 'error', text: 'We could not load the queue. Please try again.' })
        }
      })
    return () => {
      ignore = true
    }
  }, [])

  // Load once, then again whenever a profile changes here or in another tab.
  useEffect(() => {
    let cancel = load()
    const refresh = () => {
      cancel()
      cancel = load()
    }
    window.addEventListener(PROFILE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      cancel()
      window.removeEventListener(PROFILE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [load])

  // Keep the chosen card visible inside the scrolling queue, for example after
  // an approval moves on to a card further down.
  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-current="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [selectedKey, queue])

  const selected = queue?.find((item) => keyOf(item) === selectedKey) ?? null
  // The chosen card left the queue without this page doing it: someone else
  // reviewed it (another tab), so say so instead of showing a different person.
  const reviewedElsewhere = Boolean(queue && selectedKey && !selected)

  function select(submission) {
    setSelectedKey(keyOf(submission))
    setNotice(null)
    setFocusPanel(false)
    // On a phone the panel is below the list, so bring it into view.
    if (!window.matchMedia('(min-width: 1024px)').matches) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      requestAnimationFrame(() =>
        panelRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }),
      )
    }
  }

  async function decide(submission, decision, reason) {
    setNotice(null)
    try {
      await reviewIdentity(submission, { decision, reason })
    } catch (err) {
      if (err.message === ALREADY_REVIEWED) {
        setSelectedKey(keyOf(submission))
        load() // the card leaves the list and the panel explains why
      } else {
        setNotice({ tone: 'error', text: err.message || 'Something went wrong. Please try again.' })
      }
      return
    }

    // Take the card out now and move on to the next one.
    const index = queue.findIndex((item) => keyOf(item) === keyOf(submission))
    const rest = queue.filter((item) => keyOf(item) !== keyOf(submission))
    const next = rest[Math.min(index, rest.length - 1)]
    setQueue(rest)
    setSelectedKey(next ? keyOf(next) : null)
    setFocusPanel(Boolean(next))
    setNotice({
      tone: 'success',
      text:
        decision === 'approve'
          ? `Approved. ${submission.name} is now verified.`
          : `Rejected. ${submission.name} will see your reason on their profile.`,
    })
  }

  return (
    <AdminLayout variant="admin" active="Identity checks">
      <div className="p-4 break-words sm:p-8">
        <h1 className="font-heading text-3xl font-extrabold text-navy sm:text-4xl">
          Identity checks
        </h1>
        <p className="mt-1 max-w-2xl font-body text-base text-muted">
          Citizens who sent their National ID from the Profile page. Approve to give them the
          Verified badge, or reject with a reason they can act on.
        </p>

        {/* Read out after each action. Errors use FormNotice's own alert. */}
        <p role="status" className="sr-only">
          {notice?.tone === 'success' ? notice.text : ''}
        </p>
        <div className="mt-4 empty:hidden">
          {notice && <FormNotice tone={notice.tone}>{notice.text}</FormNotice>}
        </div>

        {queue === null ? (
          <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
            <div>
              <p className="font-body text-sm font-bold text-muted">Loading the queue…</p>
              <div className="mt-3">
                <QueueSkeleton />
              </div>
            </div>
            <div
              className="hidden h-96 rounded-panel bg-mint motion-safe:animate-pulse lg:block"
              aria-hidden="true"
            />
          </div>
        ) : queue.length === 0 ? (
          <div className="mt-6 flex flex-col gap-4">
            {reviewedElsewhere && <FormNotice tone="error">{ALREADY_REVIEWED}</FormNotice>}
            <div className="rounded-panel bg-mint p-6 text-center sm:p-10">
              <p className="font-heading text-2xl font-extrabold text-navy">
                No identity checks are waiting.
              </p>
              <p className="mt-2 font-body text-base text-muted">
                New submissions from the Profile page will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
            {/* The queue scrolls on its own: sideways above the panel on small
                screens, and as a column that stays in view on large ones. */}
            <div className="min-w-0 lg:sticky lg:top-6">
              <p id="identity-queue-label" className="font-body text-sm font-bold text-muted">
                {queue.length === 1
                  ? 'One submission is waiting, oldest first.'
                  : `${queue.length} submissions are waiting, oldest first.`}
              </p>
              <ul
                ref={listRef}
                aria-labelledby="identity-queue-label"
                className={clsx(
                  'relative mt-3 flex snap-x gap-3 overflow-x-auto p-1 pb-3',
                  'lg:max-h-[calc(100dvh-13rem)] lg:snap-none lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pb-1',
                )}
              >
                {queue.map((item) => (
                  <li key={keyOf(item)} className="w-56 shrink-0 snap-start lg:w-auto">
                    <IdentityQueueCard
                      submission={item}
                      selected={selected ? keyOf(selected) === keyOf(item) : false}
                      onSelect={select}
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div ref={panelRef} className="scroll-mt-4">
              {selected ? (
                <IdentityReviewPanel
                  key={keyOf(selected)}
                  submission={selected}
                  focusOnOpen={focusPanel}
                  onDecide={(decision, reason) => decide(selected, decision, reason)}
                />
              ) : (
                <div className="flex flex-col gap-3 rounded-panel bg-mint p-6 font-body text-base text-navy">
                  {reviewedElsewhere && (
                    <FormNotice tone="error">{ALREADY_REVIEWED}</FormNotice>
                  )}
                  <p>Choose a submission from the queue to review it.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
