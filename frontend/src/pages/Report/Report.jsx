import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import AnimatedBackground from '../../components/ui/AnimatedBackground'
import ReportForm from './ReportForm'
import LocationPicker from './LocationPicker'
import { createIssue, POINTS_PER_REPORT } from '../../services/api'
import { resizeImage } from '../../utils/resizeImage'
import { useToast } from '../../components/ui/toast'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import RequireCitizen from '../Auth/RequireCitizen'
import { enter } from '../../components/ui/motion'
import { useT } from '../../i18n/useLanguage'

// Citizens only: guests log in first and come back here, staff go to their panel.
export default function Report() {
  return (
    <RequireCitizen guests="login">
      <ReportPage />
    </RequireCitizen>
  )
}

function ReportPage() {
  const t = useT()
  useDocumentTitle('Report an issue')
  const toast = useToast()
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState(null) // { lat, lng, label, ward, division } from the map
  const [searchParams] = useSearchParams()

  // A pin dropped on the Map page arrives here as /report?lat=…&lng=…
  const paramLat = parseFloat(searchParams.get('lat'))
  const paramLng = parseFloat(searchParams.get('lng'))
  const pinnedFromMap =
    Number.isFinite(paramLat) && Number.isFinite(paramLng)
      ? { lat: paramLat, lng: paramLng }
      : null

  // The server saves the report; the owner comes from the login, not from this form.
  // If this throws, the form keeps what the citizen typed and shows the message.
  async function handleSubmit({ photo, category: chosen, description }) {
    if (!location) throw new Error(t('Pick a location on the map first.'))
    const photoUrl = await resizeImage(photo)
    await createIssue({
      category: chosen,
      description,
      photoUrl,
      location,
    })
    toast.info(t('Your report is submitted. You earned {points} points.', { points: POINTS_PER_REPORT }))
  }

  return (
    <>
      <AnimatedBackground />
      <Navbar />

      <main className="relative min-h-[70vh] px-6 py-8 md:px-10">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/map"
            className="group inline-flex min-h-11 items-center gap-1 font-body text-sm font-semibold text-navy/70 transition hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            style={enter('rise-in', 0)}
          >
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-200 group-hover:-translate-x-1"
            >
              ‹
            </span>{' '}
            {t('Back to maps')}
          </Link>

          <div
            className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1"
            style={enter('rise-in', 0.05)}
          >
            <h1 className="font-heading text-4xl font-extrabold text-navy md:text-5xl">
              {t('Report an issue')}
            </h1>
            <p className="font-body text-sm text-muted">
              {t('Photo, place, and a short description. It takes about a minute.')}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <ReportForm onSubmit={handleSubmit} onCategoryChange={setCategory} />
            <LocationPicker
              category={category}
              onChange={setLocation}
              onToast={toast.info}
              initial={pinnedFromMap}
            />
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}