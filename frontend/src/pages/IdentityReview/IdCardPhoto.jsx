import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import Button from '../../components/ui/Button'
import { useT } from '../../i18n/useLanguage'

const FRAME = 'aspect-[86/54] w-full max-w-md rounded-tile'
// Messages grow with their text instead of keeping the card shape.
const MESSAGE_BOX = 'min-h-40 w-full max-w-md rounded-tile'

function CardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 text-soft"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6 16c.6-1.4 1.7-2 3-2s2.4.6 3 2M14 10h4M14 13h3" />
    </svg>
  )
}

// A card-shaped box with a message instead of a photo.
function PhotoMessage({ id, title, children, warn = false }) {
  return (
    <div
      id={id}
      className={clsx(
        MESSAGE_BOX,
        'flex flex-col items-center justify-center gap-2 border-2 border-dashed p-3 text-center wrap-anywhere sm:p-5',
        warn ? 'border-alert bg-white' : 'border-navy/25 bg-white/60',
      )}
    >
      <CardIcon />
      <p className="font-body text-sm font-bold text-navy">{title}</p>
      <div className="font-body text-xs text-soft">{children}</div>
    </div>
  )
}

// The larger view: a modal dialog. The page behind it cannot be reached
// (focus stays inside), Esc or Close closes it, and focus goes back to the
// button that opened it.
function PhotoDialog({ url, name, onClose }) {
  const t = useT()
  const dialogRef = useRef(null)
  const closeRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog.open) dialog.showModal()
    closeRef.current?.focus()
    const handleClose = () => onClose()
    dialog.addEventListener('close', handleClose) // Esc, Close and a click outside
    // No close() here: its "close" event arrives later and would shut the
    // dialog again. Removing the element is enough when it goes away.
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="identity-photo-dialog-title"
      // A click on the dark area around the box (the dialog itself) closes it.
      onClick={(e) => e.target === e.currentTarget && dialogRef.current.close()}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(60rem,calc(100vw-2rem))] overflow-auto rounded-panel bg-white p-0 shadow-2xl backdrop:bg-ink/75"
    >
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h2
            id="identity-photo-dialog-title"
            className="font-heading text-lg font-extrabold text-navy sm:text-xl"
          >
            {t('NID card photo sent by {name}', { name })}
          </h2>
          <Button ref={closeRef} variant="outline" className="shrink-0 py-2" onClick={() => dialogRef.current.close()}>
            {t('Close')}
          </Button>
        </div>
        <img
          src={url}
          alt={t('Front of the NID card sent by {name}, shown larger', { name })}
          className="max-h-[calc(100dvh-9rem)] w-full rounded-tile bg-ink/5 object-contain"
        />
        <p className="font-body text-xs text-soft">
          {t('This photo is deleted from storage as soon as you approve or reject.')}
        </p>
      </div>
    </dialog>
  )
}

// The card photo in the review panel. photo comes from useIdentityPhoto.
// noteId: the id of the message shown instead of a photo, so Approve can point to it.
// onUseReason fills in the suggested reject reason (no-photo case).
export default function IdCardPhoto({ photo, name, noteId, onUseReason }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)

  const close = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  if (photo.kind === 'loading') {
    return (
      <div role="status" className={clsx(FRAME, 'skeleton bg-white/60')}>
        <span className="sr-only">{t('Loading the card photo…')}</span>
      </div>
    )
  }

  if (photo.kind === 'sample') {
    return (
      <PhotoMessage id={noteId} title={t('Sample submission, no real card photo')}>
        {t('This made-up submission has no photo. Approve or reject it to try the flow.')}
      </PhotoMessage>
    )
  }

  if (photo.kind === 'missing') {
    return (
      <PhotoMessage id={noteId} title={t('No card photo was saved with this submission')} warn>
        <p>{t('It was sent before card photos were kept, so it cannot be approved. Reject it and ask the citizen to send it again.')}</p>
        <Button variant="outline" className="mt-3 max-w-full whitespace-normal! bg-white px-3! py-2 sm:px-5!" onClick={onUseReason}>
          {t('Use suggested reason')}
        </Button>
      </PhotoMessage>
    )
  }

  if (photo.kind === 'error') {
    return (
      <PhotoMessage id={noteId} title={t('The card photo could not be loaded')} warn>
        <p>{t('This browser could not read its storage. Approve stays off until the photo loads.')}</p>
        <Button variant="outline" className="mt-3 max-w-full whitespace-normal! bg-white px-3! py-2 sm:px-5!" onClick={photo.retry}>
          {t('Try again')}
        </Button>
      </PhotoMessage>
    )
  }

  return (
    <figure className="flex w-full max-w-md flex-col gap-2">
      <img
        src={photo.url}
        alt={t('Front of the NID card sent by {name}', { name })}
        onClick={() => setOpen(true)}
        className={clsx(FRAME, 'cursor-zoom-in bg-ink/5 object-contain shadow-sm')}
      />
      <figcaption className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-body text-xs text-soft">{t('Deleted as soon as you approve or reject.')}</span>
        <Button
          ref={triggerRef}
          variant="outline"
          className="max-w-full whitespace-normal! bg-white py-2"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          {t('View larger')}
        </Button>
      </figcaption>
      {open && <PhotoDialog url={photo.url} name={name} onClose={close} />}
    </figure>
  )
}
