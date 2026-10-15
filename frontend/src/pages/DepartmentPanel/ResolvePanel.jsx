import { useState } from 'react'
import clsx from 'clsx'
import { sentBackMessage } from './departmentFilters'

// The body of the "Resolve with proof" panel. The panel's heading and its
// Show or Hide button live in DepartmentPanel.
// error: why the last submit failed (one sentence), or null.
export default function ResolvePanel({ issue, onSubmit, busy = false, error = null }) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [file, setFile] = useState(null) // sent to onSubmit, which shrinks it
  const [note, setNote] = useState('')

  if (!issue) {
    return (
      <p className="pb-4 font-body text-base text-muted sm:pb-6">
        Pick an issue from the table to resolve it with proof.
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
          Click &quot;Start work&quot; on this issue first. Then you can add the after-photo.
        </p>
      </div>
    )
  }

  if (issue.verification === 'awaiting') {
    return (
      <div className="pb-4 sm:pb-6">
        {title}
        <p className="mt-4 font-body text-base text-muted">
          Sent to the admin. The issue stays In progress until the admin confirms the fix.
        </p>
      </div>
    )
  }

  function handleFile(event) {
    const picked = event.target.files?.[0]
    if (!picked) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(picked))
    setFile(picked)
  }

  return (
    <div>
      {title}
      {issue.sentBack && (
        <p className="mt-4 min-w-0 break-words font-body text-sm font-bold text-danger">
          {sentBackMessage(issue.sentBack)}
        </p>
      )}

      <p className="mt-5 font-body text-sm font-bold text-navy">Before · from citizen</p>
      <div className="mt-2 flex h-32 items-center justify-center rounded-card bg-slate font-body text-sm font-semibold text-mint">
        Citizen photo
      </div>

      <p className="mt-5 font-body text-sm font-bold text-navy">
        After-photo <span className="text-amber-dark">(required)</span>
      </p>
      {/* The file input covers the whole box (transparent), so the box is what
          scrolls into view and shows the focus ring. */}
      <label className="relative mt-2 flex h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-card border-2 border-dashed border-forest bg-white px-3 text-center focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-forest">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="After-photo preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <>
            <span className="font-body text-base font-bold text-navy">
              Upload after-photo
            </span>
            <span className="font-body text-sm text-muted">
              Shoot from the same spot as the original
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
        Work note
      </label>
      <textarea
        id="work-note"
        rows={3}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Filled and compacted. Surface sealed."
        className="mt-2 w-full rounded-tile border border-navy/20 bg-white p-3 font-body text-sm text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest"
      />
      <p className="mt-3 font-body text-sm text-muted">
        The issue stays In progress until the admin confirms the fix in the photo.
      </p>

      {/* Stays on screen while the panel is in view: pinned to the bottom of
          the panel (fit mode) or of the window (page scrolling). */}
      <div className="sticky bottom-0 -mx-4 mt-4 border-t border-navy/10 bg-mint px-4 py-3 sm:-mx-6 sm:px-6 sm:pb-6">
        <button
          type="button"
          disabled={!previewUrl || busy}
          onClick={() => onSubmit(issue.id, { note, file })}
          className={clsx(
            'min-h-11 w-full rounded-full bg-navy px-6 py-3 font-body text-base font-bold text-mint transition-opacity motion-reduce:transition-none',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest',
            !previewUrl || busy ? 'cursor-not-allowed opacity-40' : 'hover:opacity-90',
          )}
        >
          Submit for verification
        </button>
        {error && (
          <p role="alert" className="mt-2 min-w-0 break-words font-body text-sm font-bold text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
