import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import ReportForm from './ReportForm'
import LocationPicker from './LocationPicker'
import { createIssue } from '../../services/api'
import { resizeImage } from '../../utils/resizeImage'

export default function Report() {
  const [toast, setToast] = useState(null)
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState(null) // { lat, lng, label, ward } from the map

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
    <div className="min-h-screen bg-page">
      <Navbar variant="citizen" />

      <main className="px-6 py-8 md:px-10">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/map"
            className="inline-flex items-center gap-1 font-body text-sm font-semibold text-navy/70 transition hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
          >
            <span aria-hidden="true">‹</span> Back to maps
          </Link>

          <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="font-heading text-4xl font-extrabold text-navy md:text-5xl">
              Report an issue
            </h1>
            <p className="font-body text-sm text-muted">
              Photo, place, and a short description. It takes about a minute.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <ReportForm onSubmit={handleSubmit} onCategoryChange={setCategory} />
            <LocationPicker category={category} onChange={setLocation} onToast={setToast} />
          </div>
        </div>
      </main>

      <Footer />

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[1200] -translate-x-1/2 rounded-full bg-navy px-5 py-2.5 font-body text-sm font-semibold text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
