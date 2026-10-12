import { useCallback, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import AnimatedBackground from '../../components/ui/AnimatedBackground'
import { useViewer } from '../Map/useViewer'
import { useStoredIds } from '../Map/useStoredIds'
import { useUnreadCount } from '../Map/useUnreadCount'
import { useDocumentTitle } from '../IssueDetail/useDocumentTitle'
import { useProfile } from '../../hooks/useProfile'
import { useUnsavedChanges } from './useUnsavedChanges'
import PersonalDetailsCard from './PersonalDetailsCard'
import PhoneCard from './PhoneCard'
import IdentityCard from './IdentityCard'
import SummaryCard from './SummaryCard'
import { ProfileError, ProfileLoading } from './ProfileStates'

const LEAVE_MESSAGE = 'You have changes that are not saved. Leave this page anyway?'

// Only citizens have a profile. Everyone else goes to the login page.
export default function Profile() {
  const viewer = useViewer()
  if (!viewer.canAct) return <Navigate to="/login" replace />
  return <ProfilePage viewer={viewer} />
}

function ProfilePage({ viewer }) {
  const { profile, loading, error, reload } = useProfile()
  const [followedIds] = useStoredIds(viewer.storageKey('followed'))
  const unread = useUnreadCount(followedIds.length)
  useDocumentTitle('Your profile')

  // Which sections have changes that are not saved yet.
  const [dirty, setDirty] = useState({})
  const markDirty = useCallback(
    (section, value) =>
      setDirty((current) => (current[section] === value ? current : { ...current, [section]: value })),
    [],
  )
  const onDirty = useMemo(
    () => ({
      details: (value) => markDirty('details', value),
      phone: (value) => markDirty('phone', value),
      identity: (value) => markDirty('identity', value),
    }),
    [markDirty],
  )
  useUnsavedChanges(Object.values(dirty).some(Boolean), LEAVE_MESSAGE)

  return (
    <>
      <AnimatedBackground />
      <Navbar variant="citizen" unread={unread} />

      <main className="relative min-h-[70vh] px-4 py-8 sm:px-6 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="font-heading text-4xl font-extrabold text-navy md:text-5xl">
              Your profile
            </h1>
            <p className="font-body text-sm text-muted">
              A verified profile helps departments trust and act on your reports.
            </p>
          </div>

          {loading && <ProfileLoading />}
          {!loading && !profile && error && <ProfileError onRetry={reload} />}

          {profile && (
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
              {/* first on phones, right-hand column on wide screens */}
              <div className="lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1">
                <SummaryCard profile={profile} />
              </div>

              <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
                <PersonalDetailsCard profile={profile} onDirtyChange={onDirty.details} />
                <PhoneCard profile={profile} onDirtyChange={onDirty.phone} />
                <IdentityCard profile={profile} onDirtyChange={onDirty.identity} />
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
