import { useEffect, useState } from 'react'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import {
  getStats,
  getFixedThisWeek,
  getHeroSlides,
  getHeroCategories,
} from '../../services/api'
import HeroSlider from './HeroSlider'
import StatsRow from './StatsRow'
import HowItWorksSection from './HowItWorksSection'
import FixedThisWeekSection from './FixedThisWeekSection'

export default function Home() {
  const [data, setData] = useState(null)

  useEffect(() => {
    let ignore = false
    Promise.all([getStats(), getFixedThisWeek(), getHeroSlides(), getHeroCategories()]).then(
      ([stats, fixed, slides, categories]) => {
        if (!ignore) setData({ stats, fixed, slides, categories })
      },
    )
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
        <HowItWorksSection example={data?.fixed?.[0]} />
        <FixedThisWeekSection issues={data?.fixed ?? []} />
      </main>
      <Footer />
    </div>
  )
}