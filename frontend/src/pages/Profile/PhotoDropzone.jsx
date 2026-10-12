import { useRef, useState } from 'react'
import clsx from 'clsx'
import Button from '../../components/ui/Button'

// Photo picker for the NID card: drop a file or browse, like the Report form.
// The preview stays blurred until it is hovered or focused, or until
// "Show preview" is pressed (for touch screens and keyboards).
//   photo: { file, url } or null
export default function PhotoDropzone({ id, labelId, photo, error, onFile, onRemove }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [revealed, setRevealed] = useState(false)

  function choose(file) {
    setRevealed(false)
    onFile(file)
    if (inputRef.current) inputRef.current.value = '' // lets the same file be chosen again
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    choose(e.dataTransfer.files?.[0])
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-labelledby={labelId}
        onChange={(e) => choose(e.target.files?.[0])}
      />

      {photo ? (
        <div className="flex flex-wrap items-center gap-4 rounded-tile bg-white/70 p-3">
          <div className="group relative h-24 w-36 shrink-0 overflow-hidden rounded-chip bg-navy/10">
            <img
              src={photo.url}
              alt="Preview of your NID card photo"
              tabIndex={0}
              className={clsx(
                'h-full w-full object-cover transition duration-300 focus:outline-none',
                revealed ? 'blur-0' : 'scale-110 blur-md group-hover:scale-100 group-hover:blur-0 focus:scale-100 focus:blur-0',
              )}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="truncate font-body text-xs text-navy">{photo.file.name}</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={revealed}
                onClick={() => setRevealed((value) => !value)}
                className="rounded-full px-3 py-1 font-body text-xs font-semibold text-forest transition hover:bg-forest/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
              >
                {revealed ? 'Hide preview' : 'Show preview'}
              </button>
              <Button variant="outline" onClick={() => inputRef.current?.click()}>
                Choose another
              </Button>
              <Button variant="outline" onClick={onRemove}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          aria-describedby={labelId}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={clsx(
            'lift flex h-28 w-full flex-col items-center justify-center gap-1 rounded-tile border-2 border-dashed px-4 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50 sm:max-w-sm',
            dragging ? 'scale-[1.02] border-forest bg-white' : 'border-forest/60 bg-white/70 hover:border-forest hover:bg-white',
          )}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7 text-forest"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="11" r="2" />
            <path d="M14 10h4M14 13h3M6 16h6" />
          </svg>
          <span className="font-body text-sm font-semibold text-navy">
            {dragging ? 'Drop it here' : 'Drop a photo here or browse'}
          </span>
          <span className="font-body text-xs text-muted">JPG, PNG or WebP, up to 5 MB</span>
        </button>
      )}

      {error && (
        <p role="alert" className="font-body text-xs font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
