import { useEffect, useState } from 'react'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { getIssueById, getStats, getFixedThisWeek } from '../../services/api'
import HeroSection from './HeroSection'
import StatsRow from './StatsRow'
import HowItWorksSection from './HowItWorksSection'
import FixedThisWeekSection from './FixedThisWeekSection'

export default function Home() {
  const [data, setData] = useState(null)

  useEffect(() => {
    let ignore = false
    Promise.all([getStats(), getFixedThisWeek(), getIssueById(1)]).then(
      ([stats, fixed, featured]) => {
        if (!ignore) setData({ stats, fixed, featured })
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
        <HeroSection issue={data?.featured} />
        <StatsRow stats={data?.stats} />
        <HowItWorksSection example={data?.fixed?.[0]} />
        <FixedThisWeekSection issues={data?.fixed ?? []} />
      </main>
      <Footer />
    </div>
  )
}