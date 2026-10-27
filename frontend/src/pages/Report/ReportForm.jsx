import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import CategoryChip from '../../components/ui/CategoryChip'
import { TITLE_MAX, TITLE_MIN } from '../../services/api'
import { enter } from '../../components/ui/motion'
import AssistPanel from './AssistPanel'
import SummarizeButton from './SummarizeButton'
import DuplicatePanel from './DuplicatePanel'

const REPORT_CATEGORIES = ['Roads', 'Waste', 'Water', 'Lighting', 'Bridges']
const MAX_PHOTO_MB = 5
const MIN_DESCRIPTION = 10
const MAX_DESCRIPTION = 500
const NEAR_LIMIT = 450

const rise = (delay) => enter('rise-in', delay)

function StepHeading({ number, done, children }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={clsx(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-body text-sm font-bold text-white transition duration-300',
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

// The optional props after onCategoryChange are for editing a report
// (the Edit issue page). The Report page leaves them out.
//     Without it the report is saved with no pin (and no pin points).
//   initialValues: { title, category, description, photoUrl } fills the form
//     and adds a Title field. Save then needs a change, and the form is not
//     cleared after saving.
//   onCancel: shows a Cancel button next to Save.
//   pinChanged: the map pin moved, which counts as a change.
//   onDirtyChange(dirty): true while the fields differ from initialValues.
//   lockedReason: a message. The form is shown but cannot be changed or sent.
//   deleted: the report was deleted elsewhere. The title and description stay
//            readable and can be copied (read-only, not disabled), and there
//            is no Save button.
export default function ReportForm({
  onSubmit,
  onCategoryChange,
  initialValues,
  submitLabel = 'Submit report',
  onCancel,
  pinChanged = false,
  onDirtyChange,
  lockedReason,
  deleted = false,
}) {
  const editing = Boolean(initialValues)
  const locked = Boolean(lockedReason) || deleted
  const textLock = deleted ? { readOnly: true } : { disabled: locked }
  // { file, url }. A photo kept from the saved report has no file.
  const [photo, setPhoto] = useState(() =>
    initialValues?.photoUrl ? { file: null, url: initialValues.photoUrl } : null,
  )
  const [photoError, setPhotoError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [category, setCategory] = useState(initialValues?.category ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const inputRef = useRef(null)

  // free the preview URL when the photo changes or the form unmounts
  useEffect(() => {
    return () => {
      if (photo?.file) URL.revokeObjectURL(photo.url)
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

  // F6: the assistant's suggestion fills the description, and the category only
  // when the citizen has not picked one yet.
  function applySuggestion({ category: suggested, description: text }) {
    if (suggested) {
      setCategory(suggested)
      onCategoryChange?.(suggested)
    }
    if (text) setDescription(text.slice(0, MAX_DESCRIPTION))
  }

  const trimmed = description.trim()
  const trimmedTitle = title.trim()
  const titleOk = !editing || trimmedTitle.length >= TITLE_MIN
  const stepsDone = [
    Boolean(photo),
    Boolean(category),
    trimmed.length >= MIN_DESCRIPTION && titleOk,
  ]
  const doneCount = stepsDone.filter(Boolean).length
  const isComplete = doneCount === 3
  const fieldsChanged =
    editing &&
    (trimmedTitle !== initialValues.title ||
      category !== initialValues.category ||
      trimmed !== initialValues.description ||
      photo?.url !== initialValues.photoUrl)
  const hasChanges = !editing || fieldsChanged || pinChanged
  const canSubmit = isComplete && hasChanges && !locked && !submitting

  useEffect(() => {
    onDirtyChange?.(fieldsChanged)
  }, [fieldsChanged, onDirtyChange])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError('')
    try {
      if (editing) {
        await onSubmit?.({ photo: photo.file, category, description: trimmed, title: trimmedTitle })
        return // the page moves on to the issue
      }

      // the page saves the report (Report.jsx)
      await onSubmit?.({ photo: photo.file, category, description: trimmed })
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
  if (!titleOk) missing.push('a title')
  if (trimmed.length < MIN_DESCRIPTION) missing.push('a short description')

  let hintText = `Still needed: ${missing.join(', ')}.`
  if (isComplete && !editing) hintText = 'Clear photos and exact pins earn you points.'
  else if (isComplete) hintText = hasChanges ? 'Your changes are ready to save.' : 'Change something to save.'

  const submitButton = (
    <button
      type="submit"
      disabled={!canSubmit}
      className={clsx(
        'group w-full rounded-full bg-navy px-6 py-4 font-body text-sm font-bold text-white transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/60 focus-visible:ring-offset-2',
        canSubmit
          ? 'shadow-lg shadow-navy/25 hover:-translate-y-0.5 hover:bg-navy/90 hover:shadow-xl active:translate-y-0 active:scale-[0.99]'
          : 'cursor-not-allowed opacity-50',
      )}
    >
      {submitting ? (
        editing ? 'Saving…' : 'Submitting…'
      ) : (
        <>
          {submitLabel}{' '}
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
  )

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-7 rounded-card bg-mint/85 p-6 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-xl md:p-7"
    >

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
            className="h-full origin-left rounded-full bg-forest transition-transform duration-500 ease-out"
            style={{ transform: `scaleX(${doneCount / 3})` }}
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
          tabIndex={-1}
          aria-hidden="true"
          disabled={locked}
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
              <span className="truncate font-body text-xs text-navy">
                {photo.file ? photo.file.name : 'Current photo'}
              </span>
              <button
                type="button"
                onClick={removePhoto}
                disabled={locked}
                className="min-h-11 shrink-0 rounded-full px-3 py-1 font-body text-xs font-semibold text-forest transition hover:bg-forest/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={locked}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={clsx(
              'group flex h-36 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 text-center transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50',
              dragging
                ? 'scale-[1.02] border-forest bg-white shadow-lg'
                : 'border-forest/60 bg-white/70 hover:scale-[1.01] hover:border-forest hover:bg-white hover:shadow-md',
            )}
          >
            <svg
              viewBox="0 0 24 24"
              className={clsx(
                'h-8 w-8 text-forest transition-transform duration-300 group-hover:scale-110',
                !dragging && 'animate-float',
              )}
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
          <p role="alert" className="font-body text-xs font-semibold text-danger">
            {photoError}
          </p>
        )}

        {!editing && (
          <AssistPanel
            photo={photo?.file ?? null}
            category={category}
            description={description}
            disabled={locked}
            onApply={applySuggestion}
          />
        )}
        {!editing && <DuplicatePanel photo={photo?.file ?? null} disabled={locked} />}
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
              onClick={
                locked
                  ? undefined
                  : () => {
                      setCategory(c)
                      onCategoryChange?.(c)
                    }
              }
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
        {editing && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="report-title" className="font-body text-sm font-semibold text-navy">
              Title
            </label>
            <input
              id="report-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
              {...textLock}
              aria-describedby="report-title-help"
              className="w-full rounded-full border border-navy/15 bg-white px-4 py-3 font-body text-sm text-navy transition hover:border-forest/50 focus:border-forest focus:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 disabled:opacity-50"
            />
            <p id="report-title-help" className="font-body text-xs text-muted">
              {`A short name for the problem, ${TITLE_MIN} to ${TITLE_MAX} characters.`}
            </p>
            <SummarizeButton
              text={description}
              disabled={locked}
              onUse={(summary) => setTitle(summary.slice(0, TITLE_MAX))}
            />
          </div>
        )}
        <label htmlFor="report-description" className="sr-only">
          Describe the problem
        </label>
        <textarea
          id="report-description"
          {...textLock}
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
          rows={4}
          placeholder="Large pothole in the left lane, about half a metre wide…"
          className="w-full resize-none rounded-2xl border border-navy/15 bg-white px-4 py-3 font-body text-sm text-navy placeholder:text-muted transition hover:border-forest/50 focus:border-forest focus:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 disabled:opacity-50"
        />
        <p
          className={clsx(
            'text-right font-body text-xs transition-colors',
            description.length >= NEAR_LIMIT ? 'font-semibold text-danger' : 'text-muted',
          )}
        >
          {description.length}/{MAX_DESCRIPTION}
        </p>
      </section>

      {/* submit */}
      <div className="flex flex-col items-center gap-2" style={rise(0.4)}>
        {onCancel ? (
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onCancel}
              className="flex shrink-0 items-center justify-center rounded-full border-2 border-navy/20 bg-white px-6 py-3.5 font-body text-sm font-bold text-navy transition hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/60 focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            {!deleted && submitButton}
          </div>
        ) : (
          !deleted && submitButton
        )}
        {submitError && (
          <p role="alert" className="text-center font-body text-xs font-semibold text-danger">
            {submitError}
          </p>
        )}
        {locked ? (
          <p className="text-center font-body text-xs font-semibold text-danger">
            {lockedReason}
          </p>
        ) : (
          <p aria-live="polite" className="text-center font-body text-xs text-muted">
            {hintText}
          </p>
        )}
      </div>
    </form>
  )
}
