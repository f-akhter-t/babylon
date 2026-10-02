import { useEffect, useState } from 'react'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import {
  getIssueById,
  getStats,
  getFixedThisWeek,
  getHeroSlides,
} from '../../services/api'
import HeroSlider from './HeroSlider'
import StatsRow from './StatsRow'
import HowItWorksSection from './HowItWorksSection'
import FixedThisWeekSection from './FixedThisWeekSection'

export default function Home() {
  const [data, setData] = useState(null)

  useEffect(() => {
    let ignore = false
    Promise.all([getStats(), getFixedThisWeek(), getIssueById(1), getHeroSlides()]).then(
      ([stats, fixed, featured, slides]) => {
        if (!ignore) setData({ stats, fixed, featured, slides })
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
        <HeroSlider
          slides={data?.slides}
          issue={data?.featured}
          fixedIssue={data?.fixed?.[0]}
        />
        <StatsRow stats={data?.stats} />
        <HowItWorksSection example={data?.fixed?.[0]} />
        <FixedThisWeekSection issues={data?.fixed ?? []} />
      </main>
      <Footer />
    </div>
  )
}
