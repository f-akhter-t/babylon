import { ShareIcon } from './DetailIcons'
import { useToast } from '../../components/ui/toast'

// Phones and tablets get the system share sheet. Desktop Chrome on Windows
// has one too, but there copying the link is what people expect.
function canUseShareSheet() {
  return typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches
}

// Shares this page's address: the share sheet on touch devices, otherwise
// it copies the link and says so in a toast.
export default function ShareButton({ title }) {
  const toast = useToast()

  async function share() {
    const url = window.location.href
    if (canUseShareSheet()) {
      try {
        await navigator.share({ title, url })
        return // the phone confirms it itself
      } catch (error) {
        if (error?.name === 'AbortError') return // the person closed the sheet: say nothing
        // Any other problem: fall back to copying the link.
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.info('The link to this issue is copied.')
    } catch {
      toast.error("We couldn't copy the link. Use the address bar instead.") // clipboard blocked or not available
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-2 border-navy/20 bg-white px-3.5 text-sm font-semibold text-navy transition hover:border-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy motion-safe:active:scale-95"
    >
      <ShareIcon size={16} />
      Share
    </button>
  )
}
