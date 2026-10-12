import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import AlertsLevelCard from './AlertsLevelCard'
import AlertRow from './AlertRow'
import { useViewer } from '../Map/useViewer'
import { getCurrentUser, getEarnPoints, getAlerts, getUnreadAlertCount } from '../../services/api'

const GROUPS = [
  { value: 'All', label: 'All' },
  { value: 'status', label: 'Status updates' },
  { value: 'nearby', label: 'Nearby' },
  { value: 'reopened', label: 'Reopened' },
]

export default function Alerts() {
  const viewer = useViewer()

  // Only citizens have reports and points. Guests, departments and admins get no data.
  const userName = viewer.canAct ? (viewer.session?.name ?? null) : null

  const [group, setGroup] = useState('All')
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [earnPoints, setEarnPoints] = useState([])
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let active = true
    Promise.all([getCurrentUser(userName), getEarnPoints(), getUnreadAlertCount(userName)]).then(
      ([currentUser, points, unreadCount]) => {
        if (!active) return
        setUser(currentUser)
        setEarnPoints(points)
        setUnread(unreadCount)
      },
    )
    return () => {
      active = false
    }
  }, [userName])

  useEffect(() => {
    let active = true
    setLoading(true)
    getAlerts(group, userName).then((list) => {
      if (active) {
        setAlerts(list)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [group, userName])

  return (
    <>
      <Navbar variant={viewer.session ? viewer.role : 'logged-out'} unread={unread} />

      <main className="min-h-[70vh] bg-page px-6 py-8 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="font-heading text-4xl font-extrabold text-navy md:text-5xl">
              Alerts and points
            </h1>
            {user && (
              <p className="font-body text-sm text-muted">
                {user.name} · {user.role}
              </p>
            )}
          </div>

          {!userName ? (
            <div className="mt-8 rounded-card bg-mint px-6 py-10 text-center">
              <p className="font-heading text-xl font-extrabold text-navy">
                {viewer.isGuest
                  ? 'Log in to see your alerts and points'
                  : 'Alerts and points are for citizen accounts'}
              </p>
              <p className="mt-1 font-body text-sm text-navy/75">
                {viewer.isGuest
                  ? 'Your points grow with every report you file.'
                  : 'Log in with a citizen account to see them.'}
              </p>
              <Link
                to="/login"
                className="mt-4 inline-block rounded-full bg-navy px-6 py-2.5 font-body text-sm font-semibold text-mint transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                Log in
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-[350px_1fr] lg:items-start">
              {/* Left column: level card + how you earn points */}
              <div className="flex flex-col gap-5">
                {user && <AlertsLevelCard user={user} earnPoints={earnPoints} />}
              </div>

              {/* Right column: filters + alerts */}
              <div>
                <div className="flex flex-wrap gap-2">
                  {GROUPS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGroup(g.value)}
                      className={clsx(
                        'rounded-full border px-4 py-2 font-body text-sm font-semibold transition-all duration-200',
                        'hover:-translate-y-0.5 hover:shadow-md active:translate-y-0',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40',
                        group === g.value
                          ? 'border-navy bg-navy text-mint'
                          : 'border-slate/60 text-navy hover:border-navy hover:bg-navy hover:text-mint',
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-3.5">
                  {loading &&
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-[76px] animate-pulse rounded-card bg-mint/60" />
                    ))}

                  {!loading && alerts.map((alert) => <AlertRow key={alert.id} alert={alert} />)}

                  {!loading && alerts.length === 0 && (
                    <div className="mt-8 flex flex-col items-center gap-2 text-center">
                      <span className="text-3xl">🔔</span>
                      <p className="font-body text-muted">
                        Nothing here yet. File a report and your alerts will show up here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}