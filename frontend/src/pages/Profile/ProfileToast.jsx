import clsx from 'clsx'

// The same toast as the Report page. Only for the eyes: the page's announcer
// already reads the message out, so screen readers do not hear it twice.
// raised: lifts it above the phone save bar.
export default function ProfileToast({ message, raised }) {
  if (!message) return null

  return (
    <div
      aria-hidden="true"
      className={clsx(
        'fixed left-1/2 z-[1200] w-max max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full bg-navy px-5 py-2.5 text-center font-body text-sm font-semibold text-white shadow-lg',
        raised ? 'bottom-24 lg:bottom-6' : 'bottom-6',
      )}
      style={{ animation: 'toastIn 0.25s ease-out' }}
    >
      {message}
    </div>
  )
}
