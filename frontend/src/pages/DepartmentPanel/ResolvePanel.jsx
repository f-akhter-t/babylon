import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { sentBackMessage } from './departmentFilters'
import { getIssueById } from '../../services/api'
import { useT } from '../../i18n/useLanguage'

const NEEDS_PHOTO_ID = 'resolve-needs-photo'
const SUBMIT_ERROR_ID = 'resolve-submit-error'

// The body of the "Resolve with proof" panel. The panel's heading and its
// Show or Hide button live in DepartmentPanel.
// error: why the last submit failed (one sentence), or null.
export default function ResolvePanel({ issue, onSubmit, busy = false, error = null }) {
  const t = useT()
  const [previewUrl, setPreviewUrl] = useState(null)
  const [file, setFile] = useState(null) // sent to onSubmit, which shrinks it
  const [note, setNote] = useState('')
  // The preview's object URL, freed when it is replaced and when the panel
  // goes away (another issue, or after a successful submit). The photo that is
  // sent is a separate, smaller copy made by resizeImage.
  const previewRef = useRef(null)
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    },
    [],
  )
  // The list leaves the citizen's photo out (it is large), so fetch it for
  // the selected issue only. The panel is keyed by issue id, so no stale photo.
  const issueId = issue?.id
  const [beforeImg, setBeforeImg] = useState(null)
  useEffect(() => {
    if (!issueId) return undefined
    let ignore = false
    getIssueById(issueId)
      .then((full) => {
        if (!ignore) setBeforeImg(full?.beforeImg ?? null)
      })
      .catch(() => {
        // No photo is not an error for the staff member: the text box stays.
      })
    return () => {
      ignore = true
    }
  }, [issueId])
  if (!issue) {
    return (
      <p className="pb-4 font-body text-base text-muted sm:pb-6">
        {t('Pick an issue from the table to resolve it with proof.')}
      </p>
    )
  }

  const title = (
    <h3 className="break-words font-heading text-2xl font-extrabold text-navy">{issue.title}</h3>
  )

  if (issue.status === 'open') {
    return (
      <div className="pb-4 sm:pb-6">
        {title}
        <p className="mt-4 font-body text-base text-muted">
          {t('Click "Start work" on this issue first. Then you can add the after-photo.')}
        </p>
      </div>
    )
  }

  if (issue.verification === 'awaiting') {
    return (
      <div className="pb-4 sm:pb-6">
        {title}
        <p className="mt-4 font-body text-base text-muted">
          {t('Sent to the admin. The issue stays In progress until the admin confirms the fix.')}
        </p>
      </div>
    )
  }

  function handleFile(event) {
    const picked = event.target.files?.[0]
    if (!picked) return
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = URL.createObjectURL(picked)
    setPreviewUrl(previewRef.current)
    setFile(picked)
  }

  // Without a photo the button stays focusable (aria-disabled) so its reason
  // is read out; while saving it is really disabled.
  const needsPhoto = !previewUrl
  const describedBy = [needsPhoto && NEEDS_PHOTO_ID, error && SUBMIT_ERROR_ID]
    .filter(Boolean)
    .join(' ')

  return (
    <div>
      {title}
      {issue.sentBack && (
        <p className="mt-4 min-w-0 break-words font-body text-sm font-bold text-alert">
          {sentBackMessage(issue.sentBack, t)}
        </p>
      )}

      <p className="mt-5 font-body text-sm font-bold text-navy">{t('Before photo from the citizen')}</p>
      <div className="mt-2 flex h-32 items-center justify-center overflow-hidden rounded-card bg-slate font-body text-sm font-semibold text-frost">
        {beforeImg ? (
          <img
            src={beforeImg}
            alt={t('Before photo from the citizen')}
            className="h-full w-full object-cover"
          />
        ) : (
          t('Citizen photo')
        )}
      </div>

      <p className="mt-5 font-body text-sm font-bold text-navy">
        After-photo <span className="text-alert">{t('(required)')}</span>
      </p>
      {/* The file input covers the whole box (transparent), so the box is what
          scrolls into view and shows the focus ring. */}
      <label className="relative mt-2 flex h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-card border-2 border-dashed border-accent bg-white px-3 text-center focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={t('After-photo preview')}
            className="h-full w-full object-cover"
          />
        ) : (
          <>
            <span className="font-body text-base font-bold text-navy">
              {t('Upload after-photo')}
            </span>
            <span className="font-body text-sm text-muted">
              {t('Shoot from the same spot as the original')}
            </span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={handleFile}
        />
      </label>

      <label className="mt-5 block font-body text-sm font-bold text-navy" htmlFor="work-note">
        {t('Work note')}
      </label>
      <textarea
        id="work-note"
        rows={3}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('Filled and compacted. Surface sealed.')}
        className="mt-2 w-full rounded-tile border border-navy/60 bg-white p-3 font-body text-sm text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <p className="mt-3 font-body text-sm text-muted">
        {t('The issue stays In progress until the admin confirms the fix in the photo.')}
      </p>

      {/* Stays on screen while the panel is in view: pinned to the bottom of
          the panel (fit mode) or of the window (page scrolling). */}
      <div data-toast-clearance className="sticky bottom-0 -mx-4 mt-4 border-t border-navy/10 bg-mint px-4 py-3 sm:-mx-6 sm:px-6 sm:pb-6">
        <button
          type="button"
          disabled={busy}
          aria-disabled={needsPhoto || undefined}
          aria-describedby={describedBy || undefined}
          onClick={() => {
            if (needsPhoto) return
            onSubmit(issue.id, { note, file })
          }}
          className={clsx(
            'min-h-11 w-full rounded-full bg-ink px-6 py-3 font-body text-base font-bold text-frost transition-opacity motion-reduce:transition-none',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            // ! beats the global "button:not(:disabled)" pointer rule in index.css.
            needsPhoto || busy ? 'cursor-not-allowed! opacity-50' : 'hover:opacity-90',
          )}
        >
          {t('Submit for verification')}
        </button>
        {needsPhoto && (
          <p id={NEEDS_PHOTO_ID} className="mt-2 font-body text-sm text-navy">
            {t('Add an after-photo to submit this fix.')}
          </p>
        )}
        {error && (
          <p
            id={SUBMIT_ERROR_ID}
            role="alert"
            className="mt-2 min-w-0 break-words font-body text-sm font-bold text-alert"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
