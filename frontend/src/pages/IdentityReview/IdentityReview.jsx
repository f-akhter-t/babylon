import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import AdminLayout from '../../components/layout/AdminLayout'
import FormNotice from '../Profile/FormNotice'
import IdentityQueueCard from './IdentityQueueCard'
import LogoLoader from '../../components/ui/LogoLoader'
import IdentityReviewPanel from './IdentityReviewPanel'
import RequireRole from '../Auth/RequireRole'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { fit } from '../../components/layout/staffFit'
import ListToolbar from '../../components/ui/ListToolbar'
import Pager from '../../components/ui/Pager'
import { useListView } from '../../hooks/useListView'
import {
  ALREADY_REVIEWED,
  getIdentityQueue,
  PROFILE_EVENT,
  reviewIdentity,
} from '../../services/api'
import { useT } from '../../i18n/useLanguage'

// A submission is the same one only while its date matches, so a citizen who
// sends again after a rejection shows up as a fresh card.
const keyOf = (submission) => `${submission.id}|${submission.submittedAt}`

// Search and sort for the list (see hooks/useListView.js). Module level, so they never change.
const NONE = []
const submissionText = (item) => `${item.name} ${item.email}`
const sentAt = (item) => Date.parse(item.submittedAt) || 0
const SORTS = {
  oldest: { label: 'Oldest first', compare: null }, // the server's order
  newest: { label: 'Newest first', compare: (a, b) => sentAt(b) - sentAt(a) },
  name: { label: 'Name', compare: (a, b) => String(a.name).localeCompare(String(b.name)) },
}

const PHOTO_NOT_DELETED =
  'The card photo could not be deleted yet. It will be removed automatically the next time this queue loads.'

// The submissions list, in its own section beside (or above) the review panel.
// Its list scrolls down inside the section.
function QueueSection({ label, children }) {
  const t = useT()
  return (
    <section
      aria-labelledby="identity-queue-heading"
      className={clsx(
        'min-w-0 overflow-hidden rounded-panel bg-ink p-4 lg:w-72 lg:shrink-0',
        fit.column,
      )}
    >
      <h2 id="identity-queue-heading" className="px-1 font-heading text-xl font-extrabold text-frost">
        {t('Submissions')}
      </h2>
      <p className="mt-1 px-1 font-body text-sm text-frost/70">{label}</p>
      <div className={clsx('mt-4', fit.column, fit.grow)}>{children}</div>
    </section>
  )
}

// Only admins review identities. Guests go to the staff sign-in page,
// other signed-in accounts go to their own home page.
export default function IdentityReview() {
  return (
    <RequireRole role="admin">
      <IdentityReviewPage />
    </RequireRole>
  )
}

function IdentityReviewPage() {
  const t = useT()
  useDocumentTitle('Identity checks')
  const [queue, setQueue] = useState(null) // null while loading
  const list = useListView(queue ?? NONE, { searchText: submissionText, sorts: SORTS, defaultSort: 'oldest', pageSize: 20 })
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
    let result
    try {
      result = await reviewIdentity(submission, { decision, reason })
    } catch (err) {
      if (err.message === ALREADY_REVIEWED) {
        setSelectedKey(keyOf(submission))
        load() // the card leaves the list and the panel explains why
      } else {
        setNotice({ tone: 'error', text: t(err.message || 'Something went wrong. Please try again.') })
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
    const done =
      decision === 'approve'
        ? t('Approved. {name} is now verified.', { name: submission.name })
        : t('Rejected. {name} will see your reason on their profile.', { name: submission.name })
    setNotice({
      tone: 'success',
      text: result.photoDeleted ? done : `${done} ${t(PHOTO_NOT_DELETED)}`,
    })
  }

  return (
    <AdminLayout variant="admin" active="Identity checks">
      <div className={clsx('p-4 break-words sm:p-6 lg:p-8', fit.page)}>
        <h1 className="font-heading text-3xl font-extrabold text-navy sm:text-4xl">
          {t('Identity checks')}
        </h1>
        <p className="mt-1 max-w-2xl font-body text-base text-muted">
          {t('Citizens who sent their National ID from the Profile page. Approve to give them the Verified badge, or reject with a reason they can act on.')}
        </p>

        {/* Read out after each action. Errors use FormNotice's own alert. */}
        <p role="status" className="sr-only">
          {notice?.tone === 'success' ? notice.text : ''}
        </p>
        <div className="mt-4 empty:hidden">
          {notice && <FormNotice tone={notice.tone}>{notice.text}</FormNotice>}
        </div>

        {queue === null ? (
          <LogoLoader label={t('Loading the queue…')} className="mt-6" />
        ) : queue.length === 0 ? (
          <div className="mt-6 flex flex-col gap-4">
            {reviewedElsewhere && <FormNotice tone="error">{ALREADY_REVIEWED}</FormNotice>}
            <div className="rounded-panel bg-mint p-6 text-center sm:p-10">
              <p className="font-heading text-2xl font-extrabold text-navy">
                {t('No identity checks are waiting.')}
              </p>
              <p className="mt-2 font-body text-base text-muted">
                {t('New submissions from the Profile page will appear here.')}
              </p>
            </div>
          </div>
        ) : (
          // In fit mode the list and the review both take the full height left,
          // and each scrolls inside itself.
          <div
            className={clsx(
              'mt-6 flex flex-col gap-6 lg:flex-row lg:items-start',
              fit.stretch,
              fit.grow,
              fit.min80,
            )}
          >
            <QueueSection
              label={
                queue.length === 1
                  ? t('One submission is waiting, oldest first.')
                  : t('{n} submissions are waiting, oldest first.', { n: queue.length })
              }
            >
              <ListToolbar
                view={list}
                sorts={SORTS}
                onDark
                searchLabel={t('Search submissions')}
                placeholder={t('Search name or email')}
              />
              <ul
                ref={listRef}
                aria-labelledby="identity-queue-heading"
                className={clsx(
                  'relative mt-3 flex max-h-96 flex-col gap-3 overflow-y-auto p-1 lg:max-h-160',
                  fit.noMaxHeight,
                  fit.grow,
                  fit.min32,
                )}
              >
                {list.total === 0 && (
                  <li className="px-1 font-body text-sm text-frost/80">{t('No issues match your search.')}</li>
                )}
                {list.pageItems.map((item) => (
                  <li key={keyOf(item)}>
                    <IdentityQueueCard
                      submission={item}
                      selected={selected ? keyOf(selected) === keyOf(item) : false}
                      onSelect={select}
                    />
                  </li>
                ))}
              </ul>
              <Pager view={list} onDark />
            </QueueSection>

            <div ref={panelRef} className={clsx('min-w-0 flex-1 scroll-mt-4', fit.column)}>
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
                  <p>{t('Choose a submission from the list to review it.')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
