import { useState } from 'react'
import clsx from 'clsx'
import { sentBackMessage } from './departmentFilters'

// error: why the last submit failed (one sentence), or null.
export default function ResolvePanel({ issue, onSubmit, busy = false, error = null }) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [file, setFile] = useState(null) // sent to onSubmit, which shrinks it
  const [note, setNote] = useState('')

  if (!issue) {
    return (
      <p className="font-body text-base text-muted">
        Pick an issue from the table to resolve it with proof.
      </p>
    )
  }

  if (issue.status === 'open') {
    return (
      <div>
        <p className="font-body text-xs font-bold uppercase tracking-widest text-forest">
          Resolve with proof
        </p>
        <h2 className="mt-1 font-heading text-2xl font-extrabold text-navy">
          {issue.title}
        </h2>
        <p className="mt-4 font-body text-base text-muted">
          Click &quot;Start work&quot; on this issue first. Then you can add the after-photo.
        </p>
      </div>
    )
  }

  if (issue.verification === 'awaiting') {
    return (
      <div>
        <p className="font-body text-xs font-bold uppercase tracking-widest text-forest">
          Resolve with proof
        </p>
        <h2 className="mt-1 font-heading text-2xl font-extrabold text-navy">
          {issue.title}
        </h2>
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
      <p className="font-body text-xs font-bold uppercase tracking-widest text-forest">
        Resolve with proof
      </p>
      <h2 className="mt-1 font-heading text-2xl font-extrabold text-navy">
        {issue.title}
      </h2>
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
      <label className="mt-2 flex h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-card border-2 border-dashed border-forest bg-white text-center">
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
        <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
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

      <button
        type="button"
        disabled={!previewUrl || busy}
        onClick={() => onSubmit(issue.id, { note, file })}
        className={clsx(
          'mt-5 w-full rounded-full bg-navy px-6 py-3.5 font-body text-base font-bold text-mint transition-opacity',
          !previewUrl || busy ? 'cursor-not-allowed opacity-40' : 'hover:opacity-90',
        )}
      >
        Submit for verification
      </button>
      {error && (
        <p role="alert" className="mt-3 min-w-0 break-words font-body text-sm font-bold text-danger">
          {error}
        </p>
      )}
      <p className="mt-3 font-body text-sm text-muted">
        The issue stays In progress until the admin confirms the fix in the photo.
      </p>
    </div>
  )
}