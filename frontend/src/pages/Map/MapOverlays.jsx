import Button from '../../components/ui/Button'
import MapLegend from './MapLegend'
import LoginPrompt from './LoginPrompt'
import { useT } from '../../i18n/useLanguage'

// Everything drawn over the map that is not part of Leaflet:
// the drop-a-pin hint, the legend, the phone-only Report button and the
// "Log in to report" box.
// report: 'link' (citizens go to /report) | 'login' (guests see the box) | 'none'
export default function MapOverlays({
  dropping,
  onStopDropping,
  report,
  showLoginPrompt,
  onOpenLoginPrompt,
  onCloseLoginPrompt,
}) {
  const t = useT()
  return (
    <>
      {dropping && (
        <div className="absolute left-1/2 top-20 z-1000 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-navy py-1.5 pl-4 pr-1.5 text-sm font-semibold text-white shadow-xl lg:top-4">
          {t('Click the map to drop a pin')}
          <button
            type="button"
            onClick={onStopDropping}
            className="rounded-full px-3 py-1 text-brand transition-colors hover:bg-white/10"
          >
            {t('Cancel')}
          </button>
        </div>
      )}

      <MapLegend className="absolute bottom-7 left-4 right-4 z-1000 sm:right-auto lg:bottom-4" />

      {/* Phones only: the desktop navbar already has a Report button. */}
      {report !== 'none' && (
        <Button
          to={report === 'link' ? '/report' : undefined}
          onClick={report === 'login' ? onOpenLoginPrompt : undefined}
          variant="dark"
          size="lg"
          className="absolute right-4 top-4 z-1000 shadow-xl transition hover:shadow-2xl motion-safe:hover:-translate-y-0.5 lg:hidden"
        >
          <span aria-hidden="true" className="text-xl leading-none text-brand">+</span>
          {t('Report an issue')}
        </Button>
      )}

      {showLoginPrompt && (
        <div className="absolute left-1/2 top-20 z-1000 w-72 -translate-x-1/2 lg:top-4">
          <LoginPrompt action="report" onClose={onCloseLoginPrompt} />
        </div>
      )}
    </>
  )
}
