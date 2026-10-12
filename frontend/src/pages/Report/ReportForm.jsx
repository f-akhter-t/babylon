import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import CategoryChip from '../../components/ui/CategoryChip'

const REPORT_CATEGORIES = ['Roads', 'Waste', 'Water', 'Lighting', 'Bridges', 'Other']
const MAX_PHOTO_MB = 5
const MIN_DESCRIPTION = 10
const MAX_DESCRIPTION = 500

function StepHeading({ number, children }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy font-body text-sm font-bold text-white"
      >
        {number}
      </span>
      <h2 className="font-heading text-lg font-extrabold text-navy">{children}</h2>
    </div>
  )
}

export default function ReportForm({ onSubmit, onCategoryChange }) {
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
  const isComplete = Boolean(photo) && Boolean(category) && trimmed.length >= MIN_DESCRIPTION

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isComplete || submitting) return
    setSubmitting(true)
    setSubmitError('')
    try {
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
  if (trimmed.length < MIN_DESCRIPTION) missing.push('a short description')

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-7 rounded-card bg-mint p-6 md:p-7"
    >
      {/* 1 — photo */}
      <section aria-labelledby="step-photo" className="flex flex-col gap-3">
        <div id="step-photo">
          <StepHeading number="1">Add a photo</StepHeading>
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
          <div className="relative overflow-hidden rounded-2xl border border-navy/10 bg-slate/10">
            <img
              src={photo.url}
              alt="Preview of the photo you chose"
              className="h-48 w-full object-cover"
            />
            <div className="flex items-center justify-between gap-3 bg-white/80 px-4 py-2">
              <span className="truncate font-body text-xs text-navy">{photo.file.name}</span>
              <button
                type="button"
                onClick={removePhoto}
                className="shrink-0 font-body text-xs font-semibold text-forest underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
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
              'flex h-36 w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-4 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50',
              dragging ? 'border-forest bg-white' : 'border-forest/60 bg-white/70 hover:bg-white',
            )}
          >
            <span className="font-body text-sm font-semibold text-navy">
              Drop a photo here or browse
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

      {/* 2 — category */}
      <section aria-labelledby="step-category" className="flex flex-col gap-3">
        <div id="step-category">
          <StepHeading number="2">What kind of problem?</StepHeading>
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
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
            />
          ))}
        </div>
      </section>

      {/* 3 — description */}
      <section aria-labelledby="step-description" className="flex flex-col gap-3">
        <div id="step-description">
          <StepHeading number="3">What is wrong?</StepHeading>
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
          className="w-full resize-none rounded-2xl border border-navy/15 bg-white px-4 py-3 font-body text-sm text-navy placeholder:text-muted transition focus:border-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
        />
        <p className="text-right font-body text-xs text-muted">
          {description.length}/{MAX_DESCRIPTION}
        </p>
      </section>

      {/* submit */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="submit"
          disabled={!isComplete || submitting}
          className="w-full rounded-full bg-navy px-6 py-4 font-body text-sm font-bold text-white transition hover:bg-navy/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/60 focus-visible:ring-offset-2"
        >
          {submitting ? 'Submitting…' : 'Submit report'}
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
