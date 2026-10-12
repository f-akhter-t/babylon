import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import AnimatedBackground from '../../components/ui/AnimatedBackground'
import ReportForm from './ReportForm'
import LocationPicker from './LocationPicker'
import { createIssue } from '../../services/api'
import { resizeImage } from '../../utils/resizeImage'

const pageStyle = `
  @keyframes pageRise {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.001ms !important;
    }
  }
`

export default function Report() {
  const [toast, setToast] = useState(null)
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState(null) // { lat, lng, label, ward } from the map
  const [searchParams] = useSearchParams()

  // A pin dropped on the Map page arrives here as /report?lat=…&lng=…
  const paramLat = parseFloat(searchParams.get('lat'))
  const paramLng = parseFloat(searchParams.get('lng'))
  const pinnedFromMap =
    Number.isFinite(paramLat) && Number.isFinite(paramLng)
      ? { lat: paramLat, lng: paramLng }
      : null

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  // Mock backend: the report is saved in the browser and shows up in the feed.
  // If this throws, the form keeps what the citizen typed and shows the message.
  async function handleSubmit({ photo, category: chosen, description }) {
    if (!location) throw new Error('Pick a location on the map first.')
    const photoUrl = await resizeImage(photo)
    await createIssue({ category: chosen, description, photoUrl, location })
    setToast('Report submitted. You can see it in the issue feed.')
  }

  return (
    <>
      <style>{pageStyle}</style>
      <AnimatedBackground />
      <Navbar variant="citizen" />

      <main className="relative min-h-[70vh] px-6 py-8 md:px-10">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/map"
            className="group inline-flex items-center gap-1 font-body text-sm font-semibold text-navy/70 transition hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
            style={{ animation: 'pageRise 0.45s ease-out both' }}
          >
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-200 group-hover:-translate-x-1"
            >
              ‹
            </span>{' '}
            Back to maps
          </Link>

          <div
            className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1"
            style={{ animation: 'pageRise 0.5s ease-out 0.05s both' }}
          >
            <h1 className="font-heading text-4xl font-extrabold text-navy md:text-5xl">
              Report an issue
            </h1>
            <p className="font-body text-sm text-muted">
              Photo, place, and a short description. It takes about a minute.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <ReportForm onSubmit={handleSubmit} onCategoryChange={setCategory} />
            <LocationPicker
              category={category}
              onChange={setLocation}
              onToast={setToast}
              initial={pinnedFromMap}
            />
          </div>
        </div>
      </main>

      <Footer />

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[1200] -translate-x-1/2 rounded-full bg-navy px-5 py-2.5 font-body text-sm font-semibold text-white shadow-lg"
          style={{ animation: 'toastIn 0.25s ease-out' }}
        >
          {toast}
        </div>
      )}
    </>
  )
}