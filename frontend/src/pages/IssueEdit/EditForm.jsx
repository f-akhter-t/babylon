import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ReportForm from '../Report/ReportForm'
import LocationPicker from '../Report/LocationPicker'
import { canEditIssue, getIssueForEdit, LOCKED_MESSAGE, updateIssue } from '../../services/api'
import { resizeImage } from '../../utils/resizeImage'
import { confirmLeave } from '../../utils/leaveGuard'
import { hasGuardEntry, useUnsavedChanges } from '../Profile/useUnsavedChanges'
import { setIssueNotice } from '../IssueDetail/issueNotice'

const LEAVE_MESSAGE = 'You have changes that are not saved. Leave this page anyway?'
const SAVED_MESSAGE = 'Your changes are saved.'

// Motion for the heading. The form and the map bring their own.
const pageStyle = `
  @keyframes editRise {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .edit-rise { animation: none !important; }
  }
`

// The form for one issue the logged-in citizen may edit (IssueEdit checks that).
export default function EditForm({ issue, email }) {
  const navigate = useNavigate()
  const fromDetail = Boolean(useLocation().state?.fromDetail)
  const headingRef = useRef(null)
  const lockedRef = useRef(null)
  const [location, setLocation] = useState(null) // { lat, lng, label, ward } from the map
  const [fieldsDirty, setFieldsDirty] = useState(false)
  const [lockedReason, setLockedReason] = useState('')
  const [exit, setExit] = useState(null) // { notice } once saved or cancelled

  const initialValues = useMemo(
    () => ({
      title: issue.title.trim(),
      category: issue.category,
      description: issue.description.trim(),
      photoUrl: issue.beforeImg,
    }),
    [issue],
  )
  const initialPin = useMemo(() => ({ lat: issue.lat, lng: issue.lng }), [issue])
  const initialPlace = useMemo(() => ({ label: issue.location, ward: issue.ward }), [issue])

  const pinChanged = Boolean(location) && (location.lat !== issue.lat || location.lng !== issue.lng)
  useUnsavedChanges((fieldsDirty || pinChanged) && !lockedReason && !exit, LEAVE_MESSAGE)

  // Start reading at the heading.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  // Work may start while this page is open (another tab, later the server).
  // Check again whenever the person comes back to the tab or storage changes.
  useEffect(() => {
    if (lockedReason) return
    let active = true
    async function check() {
      const latest = await getIssueForEdit(issue.id)
      if (active && canEditIssue(latest, email) === 'locked') setLockedReason(LOCKED_MESSAGE)
    }
    const onVisible = () => document.visibilityState === 'visible' && check()
    window.addEventListener('focus', check)
    window.addEventListener('storage', check)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      window.removeEventListener('focus', check)
      window.removeEventListener('storage', check)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [issue.id, email, lockedReason])

  useEffect(() => {
    if (lockedReason) lockedRef.current?.focus()
  }, [lockedReason])

  // Leave for the issue page without adding a history entry: go back to it if
  // we came from there, otherwise take this page's place. If the unsaved
  // changes guard still has its extra entry, it is removed first.
  useEffect(() => {
    if (!exit) return
    if (exit.notice) setIssueNotice(issue.id, exit.notice)
    const go = () =>
      fromDetail ? navigate(-1) : navigate(`/issues/${issue.id}`, { replace: true })
    if (!hasGuardEntry()) {
      go()
      return
    }
    window.addEventListener('popstate', go, { once: true })
    return () => window.removeEventListener('popstate', go)
  }, [exit, fromDetail, issue.id, navigate])

  function handleCancel() {
    if (confirmLeave()) setExit({})
  }

  // If this throws, the form keeps what the citizen typed and shows the message.
  async function handleSubmit({ photo, category, description, title }) {
    const photoUrl = photo ? await resizeImage(photo) : undefined
    try {
      await updateIssue(issue.id, {
        title,
        description,
        category,
        photoUrl,
        location: pinChanged ? location : undefined,
      })
    } catch (err) {
      if (err.code === 'locked') {
        setLockedReason(LOCKED_MESSAGE)
        return
      }
      if (err.code === 'forbidden' || err.code === 'not-found') {
        setExit({ notice: err.message })
        return
      }
      throw err
    }
    setExit({ notice: SAVED_MESSAGE })
  }

  return (
    <>
      <style>{pageStyle}</style>
      <button
        type="button"
        onClick={handleCancel}
        className="edit-rise group inline-flex items-center gap-1 rounded-full font-body text-sm font-semibold text-navy/70 transition hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
        style={{ animation: 'editRise 0.45s ease-out both' }}
      >
        <span
          aria-hidden="true"
          className="inline-block transition-transform duration-200 group-hover:-translate-x-1"
        >
          ‹
        </span>{' '}
        Back to the issue
      </button>

      <div
        className="edit-rise mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1"
        style={{ animation: 'editRise 0.5s ease-out 0.05s both' }}
      >
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="rounded-tile font-heading text-4xl font-extrabold text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-forest md:text-5xl"
        >
          Edit your report
        </h1>
        <p className="font-body text-sm text-muted">
          Votes and followers stay. Changes show on the map and in the feed straight away.
        </p>
      </div>

      {lockedReason && (
        <div
          ref={lockedRef}
          tabIndex={-1}
          role="alert"
          className="mt-5 flex flex-col gap-3 rounded-card border-2 border-amber-dark bg-white p-4 font-body text-navy shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-forest sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm font-semibold">
            {`${lockedReason} Your changes were not saved.`}
          </p>
          <button
            type="button"
            onClick={() => setExit({})}
            className="shrink-0 rounded-full bg-navy px-4 py-2 text-sm font-bold text-white transition hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/60 focus-visible:ring-offset-2"
          >
            Back to the issue
          </button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <ReportForm
          onSubmit={handleSubmit}
          initialValues={initialValues}
          submitLabel="Save changes"
          onCancel={handleCancel}
          pinChanged={pinChanged}
          onDirtyChange={setFieldsDirty}
          lockedReason={lockedReason}
        />
        <LocationPicker
          onChange={setLocation}
          initial={initialPin}
          initialPlace={initialPlace}
          excludeId={issue.id}
          showMatches={false}
        />
      </div>
    </>
  )
}
