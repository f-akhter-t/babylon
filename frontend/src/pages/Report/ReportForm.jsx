import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import CategoryChip from '../../components/ui/CategoryChip'
import { createReport, fileToDataUrl } from '../../services/reportsStore'

const REPORT_CATEGORIES = ['Roads', 'Waste', 'Water', 'Lighting', 'Bridges', 'Other']
const MAX_PHOTO_MB = 5
const MIN_DESCRIPTION = 10
const MAX_DESCRIPTION = 500
const NEAR_LIMIT = 450

// Motion for the form. Reduced-motion users are handled in Report.jsx.
const formStyle = `
  @keyframes formRise {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes cameraFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
`

const rise = (delay) => ({ animation: `formRise 0.5s ease-out ${delay}s both` })

function StepHeading({ number, done, children }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={clsx(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-body text-sm font-bold text-white transition-all duration-300',
          done ? 'scale-110 bg-forest' : 'bg-navy',
        )}
      >
        {done ? (
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m5 12 5 5 9-10" />
          </svg>
        ) : (
          number
        )}
      </span>
      <h2 className="font-heading text-lg font-extrabold text-navy">{children}</h2>
      {done && <span className="sr-only">Done</span>}
    </div>
  )
}

// location = the pin the citizen picked on the map: { name: 'Station Road, Ward 4', lat, lng }
// Report.jsx passes it in. Without it the report is saved with no pin (and no pin points).
export default function ReportForm({ onSubmit, onCategoryChange, location }) {
  const [photo, setPhoto] = useState(null) // { file, url }
  const [photoError, setPhotoError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const inputRef = useRef(null)

  // free the preview URL when the photo changes or the form unmounts
  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.url)
    }
  }, [photo])

  function handleFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose an image file (JPG, PNG or WebP).')
      return
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setPhotoError(`That photo is larger than ${MAX_PHOTO_MB} MB. Please pick a smaller one.`)
      return
    }
    setPhotoError('')
    setPhoto({ file, url: URL.createObjectURL(file) })
  }

  function removePhoto() {
    setPhoto(null)
    setPhotoError('')
    // lets the same file be chosen again
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  const trimmed = description.trim()
  const stepsDone = [Boolean(photo), Boolean(category), trimmed.length >= MIN_DESCRIPTION]
  const doneCount = stepsDone.filter(Boolean).length
  const isComplete = doneCount === 3
  const canSubmit = isComplete && !submitting

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError('')
    try {
      // 1. save the report. This is what puts a card on My reports,
      //    adds points and sends the bell notification.
      const photoUrl = await fileToDataUrl(photo.file)
      const report = createReport({
        category,
        description: trimmed,
        location: location?.name || '',
        pinned: Boolean(location?.name),
        photoUrl,
      })

      // 2. let the page react (for example go to My reports)
      await onSubmit?.({ photo: photo.file, category, description: trimmed, report })

      removePhoto()
      setCategory('')
      onCategoryChange?.('')
      setDescription('')
    } catch (err) {
      // keep what the citizen typed so they can try again
      setSubmitError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const missing = []
  if (!photo) missing.push('a photo')
  if (!category) missing.push('a category')
  if (trimmed.length < MIN_DESCRIPTION) missing.push('a short description')

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-7 rounded-card bg-mint/85 p-6 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-xl md:p-7"
    >
      <style>{formStyle}</style>

      {/* progress */}
      <div className="flex items-center gap-3" style={rise(0.05)}>
        <div
          role="progressbar"
          aria-label="Report progress"
          aria-valuemin={0}
          aria-valuemax={3}
          aria-valuenow={doneCount}
          className="h-2 flex-1 overflow-hidden rounded-full bg-navy/10"
        >
          <div
            className="h-full rounded-full bg-forest transition-all duration-500 ease-out"
            style={{ width: `${(doneCount / 3) * 100}%` }}
          />
        </div>
        <span className="font-body text-xs font-semibold text-navy">{doneCount} of 3</span>
      </div>

      {/* 1: photo */}
      <section
        aria-labelledby="step-photo"
        className="flex flex-col gap-3"
        style={rise(0.1)}
      >
        <div id="step-photo">
          <StepHeading number="1" done={stepsDone[0]}>
            Add a photo
          </StepHeading>
        </div>

        <input
          ref={inputRef}
          id="report-photo"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {photo ? (
          <div className="group relative overflow-hidden rounded-2xl border border-navy/10 bg-slate/10 shadow-sm transition-shadow duration-300 hover:shadow-lg">
            <img
              src={photo.url}
              alt="Preview of the photo you chose"
              className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="relative flex items-center justify-between gap-3 bg-white/90 px-4 py-2">
              <span className="truncate font-body text-xs text-navy">{photo.file.name}</span>
              <button
                type="button"
                onClick={removePhoto}
                className="shrink-0 rounded-full px-3 py-1 font-body text-xs font-semibold text-forest transition hover:bg-forest/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={clsx(
              'group flex h-36 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50',
              dragging
                ? 'scale-[1.02] border-forest bg-white shadow-lg'
                : 'border-forest/60 bg-white/70 hover:scale-[1.01] hover:border-forest hover:bg-white hover:shadow-md',
            )}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 text-forest transition-transform duration-300 group-hover:scale-110"
              style={dragging ? undefined : { animation: 'cameraFloat 2.6s ease-in-out infinite' }}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 8a2 2 0 0 1 2-2h1.5l1.2-1.6A1 1 0 0 1 9.5 4h5a1 1 0 0 1 .8.4L16.5 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
              <circle cx="12" cy="12.5" r="3.5" />
            </svg>
            <span className="font-body text-sm font-semibold text-navy">
              {dragging ? 'Drop it here' : 'Drop a photo here or browse'}
            </span>
            <span className="font-body text-xs text-muted">
              Show the whole problem and what is around it
            </span>
          </button>
        )}

        {photoError && (
          <p role="alert" className="font-body text-xs font-semibold text-amber-dark">
            {photoError}
          </p>
        )}
      </section>

      {/* 2: category */}
      <section
        aria-labelledby="step-category"
        className="flex flex-col gap-3"
        style={rise(0.2)}
      >
        <div id="step-category">
          <StepHeading number="2" done={stepsDone[1]}>
            What kind of problem?
          </StepHeading>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="step-category">
          {REPORT_CATEGORIES.map((c) => (
            <CategoryChip
              key={c}
              label={c}
              active={category === c}
              onClick={() => {
                setCategory(c)
                onCategoryChange?.(c)
              }}
              className="transition hover:-translate-y-0.5 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
            />
          ))}
        </div>
      </section>

      {/* 3: description */}
      <section
        aria-labelledby="step-description"
        className="flex flex-col gap-3"
        style={rise(0.3)}
      >
        <div id="step-description">
          <StepHeading number="3" done={stepsDone[2]}>
            What is wrong?
          </StepHeading>
        </div>
        <label htmlFor="report-description" className="sr-only">
          Describe the problem
        </label>
        <textarea
          id="report-description"
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
          rows={4}
          placeholder="Large pothole in the left lane, about half a metre wide…"
          className="w-full resize-none rounded-2xl border border-navy/15 bg-white px-4 py-3 font-body text-sm text-navy placeholder:text-muted transition hover:border-forest/50 focus:border-forest focus:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
        />
        <p
          className={clsx(
            'text-right font-body text-xs transition-colors',
            description.length >= NEAR_LIMIT ? 'font-semibold text-amber-dark' : 'text-muted',
          )}
        >
          {description.length}/{MAX_DESCRIPTION}
        </p>
      </section>

      {/* submit */}
      <div className="flex flex-col items-center gap-2" style={rise(0.4)}>
        <button
          type="submit"
          disabled={!canSubmit}
          className={clsx(
            'group w-full rounded-full bg-navy px-6 py-4 font-body text-sm font-bold text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/60 focus-visible:ring-offset-2',
            canSubmit
              ? 'shadow-lg shadow-navy/25 hover:-translate-y-0.5 hover:bg-navy/90 hover:shadow-xl active:translate-y-0 active:scale-[0.99]'
              : 'cursor-not-allowed opacity-50',
          )}
        >
          {submitting ? (
            'Submitting…'
          ) : (
            <>
              Submit report{' '}
              <span
                aria-hidden="true"
                className={clsx(
                  'inline-block transition-transform duration-200',
                  canSubmit && 'group-hover:translate-x-1',
                )}
              >
                →
              </span>
            </>
          )}
        </button>
        {submitError && (
          <p role="alert" className="text-center font-body text-xs font-semibold text-amber-dark">
            {submitError}
          </p>
        )}
        <p aria-live="polite" className="text-center font-body text-xs text-muted">
          {isComplete
            ? 'Clear photos and exact pins earn you points.'
            : `Still needed: ${missing.join(', ')}.`}
        </p>
      </div>
    </form>
  )
}
