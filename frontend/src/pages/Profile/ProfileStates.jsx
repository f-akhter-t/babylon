import Button from '../../components/ui/Button'
import LogoLoader from '../../components/ui/LogoLoader'
import { useT } from '../../i18n/useLanguage'

// The logo, pulsing, while the profile loads.
export function ProfileLoading() {
  const t = useT()
  return <LogoLoader label={t('Loading your profile…')} className="mt-6" />
}

export function ProfileError({ onRetry }) {
  const t = useT()
  return (
    <section
      role="alert"
      className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 rounded-panel bg-white p-8 text-center"
    >
      <h2 className="font-heading text-2xl font-extrabold text-navy">{t('Could not load your profile')}</h2>
      <p className="font-body text-sm text-soft">
        {t('Something went wrong. Please try again in a moment.')}
      </p>
      <Button variant="dark" onClick={onRetry}>
        {t('Try again')}
      </Button>
    </section>
  )
}
