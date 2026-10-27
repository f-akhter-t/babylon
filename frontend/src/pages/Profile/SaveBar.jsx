import { enter } from '../../components/ui/motion'
import { useT } from '../../i18n/useLanguage'

// Phones only: "Unsaved changes" with Save and Discard, stuck to the bottom of
// the screen while Personal details has changes. It sits at the end of the
// page content (sticky, not fixed), so it stops above the footer. The buttons
// submit or reset the details form by its id, from outside the card.
export default function SaveBar({ formId, canSave, saving }) {
  const t = useT()
  return (
    <div
      data-toast-clearance
      className="sticky bottom-0 z-[1000] -mx-4 mt-6 sm:-mx-6 md:-mx-10 lg:hidden"
      style={enter('slide-up', 0, 'var(--duration-base)')}
    >
      <div
        className="flex items-center justify-between gap-3 border-t border-frost/15 bg-ink px-4 pt-3 shadow-lg sm:px-6 md:px-10"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <p className="font-body text-sm font-semibold text-frost">{t('Unsaved changes')}</p>
        <div className="flex shrink-0 gap-2">
          <button
            type="reset"
            form={formId}
            disabled={saving}
            className="rounded-full border border-frost/30 px-4 py-2 font-body text-sm font-semibold text-frost transition hover:bg-frost/10 disabled:opacity-50"
          >
            {t('Discard')}
          </button>
          <button
            type="submit"
            form={formId}
            disabled={!canSave}
            className="rounded-full bg-brand px-4 py-2 font-body text-sm font-bold text-ink transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? t('Saving…') : t('Save')}
          </button>
        </div>
      </div>
    </div>
  )
}
