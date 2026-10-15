import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import useMyData from './useMyData'
import { statusLabel } from '../../components/ui/statusLabel'
import Reveal from '../../components/ui/Reveal'
import { BarsIcon, PinIcon } from '../../components/ui/icons'
import ReportCard from './ReportCard'
import ReportModal from './ReportModal'
import { EarnCard, LevelCard } from './LevelCard'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import RequireCitizen from '../Auth/RequireCitizen'

const FILTERS = ['All', 'Open', 'In progress', 'Resolved', 'Reopened']

// Staff go to their panel. Guests see the page with its logged-out message.
export default function MyReports() {
  return (
    <RequireCitizen guests="allow">
      <MyReportsPage />
    </RequireCitizen>
  )
}

function MyReportsPage() {
  useDocumentTitle('My reports')
  const { reports, user, earn, loading, email } = useMyData()
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  // the bell links here with ?report=<id>, so the modal opens straight from a notification
  const [params, setParams] = useSearchParams()
  const openId = params.get('report')
  const openReport = reports.find((r) => String(r.id) === openId)

  const open = (id) => setParams({ report: id })
  const close = () => setParams({})

  const count = (s) => reports.filter((r) => r.status === s).length
  const stats = [
    { label: 'Total reports', value: reports.length, dark: true },
    { label: 'Open', value: count('open') + count('reopened'), bars: 1 },
    { label: 'In progress', value: count('in_progress'), bars: 2 },
    { label: 'Resolved', value: count('resolved'), bars: 3 },
  ]

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return reports.filter(
      (r) =>
        (filter === 'All' || statusLabel(r.status) === filter) &&
        (r.title + r.location).toLowerCase().includes(q)
    )
  }, [reports, filter, query])

  const noReportsAtAll = reports.length === 0
  const loggedOut = !email

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <Navbar variant="citizen" />

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-6 pb-14 pt-8 font-body text-sm text-navy max-sm:px-3.5">
        <div className="flex flex-wrap items-end gap-3.5">
          <h1 className="font-heading text-[44px] font-extrabold leading-none tracking-tight max-md:text-[34px]">
            My reports
          </h1>
          <p className="pb-2 text-muted">Track and manage the issues you've reported.</p>
        </div>

        <h2 className="sr-only">Your progress</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1.3fr]">
          <Reveal><LevelCard user={user} /></Reveal>
          <Reveal delay={180}><EarnCard items={earn} /></Reveal>
        </div>

        <div className="my-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={100 + i * 60}>
              <div
                className={clsx(
                  'rounded-2xl px-4 py-3 transition duration-150 hover:-translate-y-0.5 hover:shadow-lift',
                  s.dark ? 'bg-navy text-mint' : 'bg-mint'
                )}
              >
                <div className="flex items-center gap-1.5 text-[13px] font-semibold">
                  {s.bars && <BarsIcon size={14} filled={s.bars} />}
                  {s.label}
                </div>
                <p className="mt-0.5 font-heading text-[30px] font-extrabold tracking-tight">{s.value}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="flex flex-wrap items-center gap-3 rounded-[20px] bg-mint px-4 py-3 shadow-bar">
            <div className="order-1 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={clsx(
                    'rounded-full border-[1.5px] border-navy px-[15px] py-[7px] font-semibold transition-colors max-md:min-h-11',
                    filter === f ? 'bg-navy text-mint' : 'hover:bg-white'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <label className="order-2 flex h-10 min-w-[200px] max-md:h-11 flex-[1_1_240px] items-center gap-2 rounded-full border-[1.5px] border-muted/50 bg-white px-3.5">
              <PinIcon size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title or location"
                className="flex-1 bg-transparent outline-none"
              />
            </label>
          </div>
        </Reveal>

        {loading ? (
          <p className="mt-6 text-center text-muted">Loading your reports…</p>
        ) : list.length > 0 ? (
          <>
            <h2 className="sr-only">Your reports</h2>
            <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 max-sm:grid-cols-1">
              {list.map((r, i) => (
                <Reveal key={r.id} delay={100 + (i % 3) * 80} className="h-full">
                  <ReportCard report={r} onOpen={open} />
                </Reveal>
              ))}
            </div>
          </>
        ) : (
          <Reveal className="mt-5">
            <div className="rounded-panel bg-mint px-5 py-12 text-center">
              <h2 className="mb-1.5 font-heading text-[28px] font-extrabold tracking-tight">
                {loggedOut
                  ? 'Log in to see your reports'
                  : noReportsAtAll
                    ? 'No reports yet'
                    : 'No matching reports'}
              </h2>
              <p className="mb-[18px] text-muted">
                {loggedOut
                  ? 'Your reports, upvotes and points are saved to your account.'
                  : noReportsAtAll
                    ? 'Report a road or infrastructure problem. Your reports, upvotes and points will show up here.'
                    : 'Try a different filter or search term.'}
              </p>
              {(loggedOut || noReportsAtAll) && (
                <Link
                  to={loggedOut ? '/login' : '/report'}
                  className="inline-flex min-h-11 items-center rounded-full bg-forest px-5 py-[11px] font-bold text-mint"
                >
                  {loggedOut ? 'Log in' : 'Report an issue'}
                </Link>
              )}
            </div>
          </Reveal>
        )}

        {openReport && <ReportModal report={openReport} onClose={close} />}
      </main>

      <Footer />
    </div>
  )
}