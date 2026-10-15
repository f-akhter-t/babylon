import { useEffect, useState } from 'react'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import {
  getStats,
  getFixedThisWeek,
  getHeroSlides,
  getHeroCategories,
  getRecentActivity,
  getIssues,
} from '../../services/api'
import HeroSlider from './HeroSlider'
import StatsRow from './StatsRow'
import ActivityTicker from './ActivityTicker'
import MapPreviewSection from './MapPreviewSection'
import HowItWorksSection from './HowItWorksSection'
import FixedThisWeekSection from './FixedThisWeekSection'
import FinalCtaBand from './FinalCtaBand'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

export default function Home() {
  useDocumentTitle('Babylon · Report. Track. Resolve.', { full: true })
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let ignore = false
    Promise.all([
      getStats(),
      getFixedThisWeek(),
      getHeroSlides(),
      getHeroCategories(),
      getRecentActivity(),
      getIssues(),
    ])
      .then(([stats, fixed, slides, categories, activity, mapIssues]) => {
        if (!ignore) setData({ stats, fixed, slides, categories, activity, mapIssues })
      })
      .catch(() => {
        if (!ignore) setFailed(true)
      })
    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="font-body">
      <Navbar variant="logged-out" />
      <main>
        <HeroSlider slides={data?.slides} categories={data?.categories} />
        <StatsRow stats={data?.stats} />
        <ActivityTicker items={data?.activity} />

        {failed && (
          <p
            role="alert"
            className="px-5 pt-6 text-sm font-semibold text-navy md:px-10 xl:px-18"
          >
            We could not load the latest data. Please refresh the page.
          </p>
        )}

        {/* The street photo is back behind the three middle sections. */}
        <div className="relative isolate overflow-hidden pb-16">
          <img
            src="/images/street-night.jpg"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 -z-10 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 -z-10 bg-page/85" />

          <MapPreviewSection issues={data?.mapIssues} />
          <HowItWorksSection example={data?.fixed?.[0]} />
          <FixedThisWeekSection issues={data?.fixed} />

          <p className="absolute bottom-3 right-5 font-body text-xs text-navy/60">
            Photo: Arif Hossain / Unsplash
          </p>
        </div>

        <FinalCtaBand />
      </main>
      <Footer />
    </div>
  )
}