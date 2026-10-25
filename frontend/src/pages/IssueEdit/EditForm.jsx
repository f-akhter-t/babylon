import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ReportForm from '../Report/ReportForm'
import LocationPicker from '../Report/LocationPicker'
import { canEditIssue, deleteIssue, getIssueForEdit, LOCKED_MESSAGE, updateIssue } from '../../services/api'
import { resizeImage } from '../../utils/resizeImage'
import { confirmLeave } from '../../utils/leaveGuard'
import { hasGuardEntry, useUnsavedChanges } from '../Profile/useUnsavedChanges'
import { setIssueNotice } from '../IssueDetail/issueNotice'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useToast } from '../../components/ui/toast'
import { enter } from '../../components/ui/motion'

const LEAVE_MESSAGE = 'You have changes that are not saved. Leave this page anyway?'
const SAVED_MESSAGE = 'Your changes are saved.'
const DELETED_MESSAGE = 'Your report was deleted.'
// Deleted in another tab while this page was open.
const DELETED_ELSEWHERE = 'This report was deleted.'

// The form for one issue the logged-in citizen may edit (IssueEdit checks that).
export default function EditForm({ issue, email }) {
  const navigate = useNavigate()
  const fromDetail = Boolean(useLocation().state?.fromDetail)
  const headingRef = useRef(null)
  const lockedRef = useRef(null)
  const [location, setLocation] = useState(null) // { lat, lng, label, ward, division } from the map
  const [fieldsDirty, setFieldsDirty] = useState(false)
  const [lockedReason, setLockedReason] = useState('')
  const [exit, setExit] = useState(null) // { notice } once saved or cancelled, { to } once deleted
  const [askingDelete, setAskingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const afterDialog = useRef(null) // what to do once the dialog has closed
  const toast = useToast()

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
  const initialPlace = useMemo(() => ({ label: issue.location, ward: issue.ward, division: issue.division }), [issue])

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
      if (!active) return
      if (!latest) setLockedReason(DELETED_ELSEWHERE)
      else if (canEditIssue(latest, email) === 'locked') setLockedReason(LOCKED_MESSAGE)
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
    const go = () => {
      if (exit.to) navigate(exit.to, { replace: true })
      else if (fromDetail) navigate(-1)
      else navigate(`/issues/${issue.id}`, { replace: true })
    }
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

  // Delete, after the citizen confirms. The dialog closes first: while it is
  // open the rest of the page (the toasts too) is inert, so the toast and the
  // move to My reports wait for handleDialogClosed.
  async function confirmDelete() {
    setDeleting(true)
    try {
      await deleteIssue(issue.id)
      afterDialog.current = () => {
        toast.info(DELETED_MESSAGE)
        setExit({ to: '/my-reports' })
      }
    } catch (err) {
      afterDialog.current = () => {
        if (err.code === 'locked') setLockedReason(LOCKED_MESSAGE)
        toast.error(err.message)
      }
    } finally {
      setDeleting(false)
      setAskingDelete(false)
    }
  }

  function handleDialogClosed() {
    const next = afterDialog.current
    afterDialog.current = null
    next?.()
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
      <button
        type="button"
        onClick={handleCancel}
        // min-h-11 -my-3: a 44px tap area without moving the heading below.
        className="group -my-3 inline-flex min-h-11 items-center gap-1 rounded-full font-body text-sm font-semibold text-navy/70 transition hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
        style={enter('rise-in', 0)}
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
        className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1"
        style={enter('rise-in', 0.05)}
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
            {lockedReason === DELETED_ELSEWHERE
              ? `${lockedReason} Your changes cannot be saved, but you can still copy them.`
              : `${lockedReason} Your changes were not saved.`}
          </p>
          <button
            type="button"
            onClick={() => setExit(lockedReason === DELETED_ELSEWHERE ? { to: '/my-reports' } : {})}
            className="shrink-0 rounded-full bg-navy px-4 py-2 text-sm font-bold text-white transition hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/60 focus-visible:ring-offset-2"
          >
            {lockedReason === DELETED_ELSEWHERE ? 'Back to My reports' : 'Back to the issue'}
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
          lockedReason={lockedReason === DELETED_ELSEWHERE ? '' : lockedReason}
          deleted={lockedReason === DELETED_ELSEWHERE}
        />
        <LocationPicker
          onChange={setLocation}
          initial={initialPin}
          initialPlace={initialPlace}
          excludeId={issue.id}
          showMatches={false}
        />
      </div>

      {/* Apart from Save, at the very end: deleting cannot be undone. */}
      {!lockedReason && (
        <div className="mt-10 border-t border-navy/10 pt-6">
          <button
            type="button"
            onClick={() => setAskingDelete(true)}
            className="inline-flex min-h-11 items-center rounded-full border-2 border-danger px-5 font-body text-sm font-bold text-danger transition-colors hover:bg-danger/10 motion-reduce:transition-none"
          >
            Delete report
          </button>
        </div>
      )}

      <ConfirmDialog
        open={askingDelete}
        title="Delete this report?"
        text="This removes it from the map, the feed and My reports. This cannot be undone."
        cancelLabel="Keep report"
        confirmLabel="Delete report"
        tone="danger"
        busy={deleting}
        onCancel={() => setAskingDelete(false)}
        onConfirm={confirmDelete}
        onClosed={handleDialogClosed}
      />
    </>
  )
}
