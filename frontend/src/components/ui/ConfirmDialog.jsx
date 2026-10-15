import { useEffect, useId, useRef } from 'react'
import clsx from 'clsx'

// A yes/no question on a native modal <dialog>. showModal() puts it in the
// top layer and makes the rest of the page inert; Tab and Shift+Tab also wrap
// between the two buttons, so focus never leaves the dialog.
// Escape or the cancel button answers "no". Focus starts on the cancel button
// and goes back to whatever opened the dialog when it closes.
//
// The page is inert while it is open, toasts included. Raise any toast from
// onClosed, which runs after the dialog has closed and focus is back.
//
//   <ConfirmDialog open={asking} title=… text=… cancelLabel=… confirmLabel=…
//     tone="danger" busy={deleting} onCancel={…} onConfirm={…} onClosed={…} />
export default function ConfirmDialog({
  open,
  title,
  text,
  cancelLabel,
  confirmLabel,
  tone = 'danger',
  busy = false,
  onCancel,
  onConfirm,
  onClosed,
}) {
  const dialogRef = useRef(null)
  const cancelRef = useRef(null)
  const confirmRef = useRef(null)
  const returnTo = useRef(null)
  const titleId = useId()
  const textId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (open && !dialog.open) {
      returnTo.current = document.activeElement
      dialog.showModal()
      cancelRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // Escape: the browser fires "cancel" first. Ignore it while busy.
  function handleCancelEvent(event) {
    event.preventDefault()
    if (!busy) onCancel()
  }

  // Keep Tab inside: past the last button back to the first, and the other way.
  function handleKeyDown(event) {
    if (event.key !== 'Tab') return
    const first = cancelRef.current
    const last = confirmRef.current
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  function handleClose() {
    returnTo.current?.focus?.()
    onClosed?.()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={textId}
      onCancel={handleCancelEvent}
      onClose={handleClose}
      onKeyDown={handleKeyDown}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-panel bg-mint p-6 font-body text-navy shadow-xl backdrop:bg-navy/60 sm:p-8"
    >
      <h2 id={titleId} className="font-heading text-2xl font-extrabold">
        {title}
      </h2>
      <p id={textId} className="mt-2 text-base text-slate">
        {text}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          ref={cancelRef}
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="min-h-11 rounded-full border-2 border-navy px-5 font-bold text-navy transition-colors hover:bg-navy/10 disabled:opacity-60 motion-reduce:transition-none"
        >
          {cancelLabel}
        </button>
        <button
          ref={confirmRef}
          type="button"
          onClick={onConfirm}
          disabled={busy}
          aria-busy={busy || undefined}
          className={clsx(
            'min-h-11 rounded-full px-5 font-bold transition-opacity hover:opacity-90 disabled:opacity-60 motion-reduce:transition-none',
            tone === 'danger' ? 'bg-danger text-white' : 'bg-navy text-mint',
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
