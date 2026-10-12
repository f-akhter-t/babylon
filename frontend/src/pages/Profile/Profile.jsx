import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import AnimatedBackground from '../../components/ui/AnimatedBackground'
import { useViewer } from '../Map/useViewer'
import { useStoredIds } from '../Map/useStoredIds'
import { useUnreadCount } from '../Map/useUnreadCount'
import { useDocumentTitle } from '../IssueDetail/useDocumentTitle'
import { useProfile } from '../../hooks/useProfile'
import { endSetup, isInSetup } from '../../services/auth'
import { useUnsavedChanges } from './useUnsavedChanges'
import { formRise, pageRise, profileStyle } from './profileMotion'
import PersonalDetailsCard from './PersonalDetailsCard'
import PhoneCard from './PhoneCard'
import IdentityCard from './IdentityCard'
import SummaryCard from './SummaryCard'
import JumpChips from './JumpChips'
import SaveBar from './SaveBar'
import ProfileToast from './ProfileToast'
import { ProfileError, ProfileLoading } from './ProfileStates'
import WelcomeHeader from './WelcomeHeader'

const LEAVE_MESSAGE = 'You have changes that are not saved. Leave this page anyway?'
const DETAILS_FORM_ID = 'profile-details-form'
const TOAST_MS = 3500

// The setup flag is cleared a moment after the page closes. React's
// development mode closes and reopens every page once on load; reopening
// cancels the clear, so the welcome view is not lost. A refresh never runs
// the clear at all, so the welcome view stays after reloading.
let pendingSetupEnd = null

function useFirstTimeSetup(email) {
  const [firstTime] = useState(() => isInSetup(email))

  useEffect(() => {
    clearTimeout(pendingSetupEnd)
    return () => {
      pendingSetupEnd = setTimeout(() => endSetup(email), 0)
    }
  }, [email])

  return firstTime
}

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
  const email = viewer.session.email
  const firstTime = useFirstTimeSetup(email)
  useDocumentTitle(firstTime ? 'Welcome' : 'Your profile')
  // A rename during setup shows straight away; the signup name until it loads.
  const welcomeName = profile?.name || viewer.session.name

  // Which sections have changes that are not saved yet.
  const [dirty, setDirty] = useState({})
  const markDirty = useCallback(
    (section, value) =>
      setDirty((current) => (current[section] === value ? current : { ...current, [section]: value })),
    [],
  )
  const onDirty = useMemo(
    () => ({
      phone: (value) => markDirty('phone', value),
      identity: (value) => markDirty('identity', value),
    }),
    [markDirty],
  )

  // Personal details also tell the phone save bar whether Save can be pressed.
  const [details, setDetails] = useState({ dirty: false, canSave: false, saving: false })
  const handleDetailsState = useCallback(
    (next) => {
      setDetails((current) =>
        current.dirty === next.dirty &&
        current.canSave === next.canSave &&
        current.saving === next.saving
          ? current
          : next,
      )
      markDirty('details', next.dirty)
    },
    [markDirty],
  )

  useUnsavedChanges(Object.values(dirty).some(Boolean), LEAVE_MESSAGE)

  // One live region for the whole page. Clearing it first makes the same
  // sentence be read out again if it repeats.
  const [spoken, setSpoken] = useState('')
  const [toast, setToast] = useState(null) // { text, id }
  const timers = useRef([])
  const announce = useCallback((text, { toast: showToast = false } = {}) => {
    setSpoken('')
    timers.current.push(setTimeout(() => setSpoken(text), 60))
    if (showToast) setToast({ text, id: Date.now() })
  }, [])
  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), TOAST_MS)
    return () => clearTimeout(timer)
  }, [toast])

  // While the phone save bar shows, keep focused fields from hiding under it.
  const showSaveBar = details.dirty
  useEffect(() => {
    if (!showSaveBar) return
    const root = document.documentElement
    root.style.scrollPaddingBottom = '6rem'
    return () => {
      root.style.scrollPaddingBottom = ''
    }
  }, [showSaveBar])

  return (
    <div className="profile-page">
      <style>{profileStyle}</style>
      <AnimatedBackground />
      <Navbar variant="citizen" unread={unread} />

      <main className="relative min-h-[70vh] px-4 pt-8 pb-8 sm:px-6 md:px-10">
        <div className="mx-auto max-w-6xl">
          {firstTime ? (
            <WelcomeHeader name={welcomeName} profile={profile} onSkip={() => endSetup(email)} />
          ) : (
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1" style={pageRise(0)}>
              <h1 className="font-heading text-4xl font-extrabold text-navy md:text-5xl">
                Your profile
              </h1>
              <p className="font-body text-sm text-muted">
                A verified profile helps departments trust and act on your reports.
              </p>
            </div>
          )}

          {profile && (
            <div style={pageRise(0.05)}>
              <JumpChips />
            </div>
          )}

          {loading && <ProfileLoading />}
          {!loading && !profile && error && <ProfileError onRetry={reload} />}

          {profile && (
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
              {/* first on phones, right-hand column on wide screens */}
              <div className="lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1" style={formRise(0.1)}>
                <SummaryCard profile={profile} showMeter={!firstTime} />
              </div>

              <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
                <div style={formRise(0.15)}>
                  <PersonalDetailsCard
                    profile={profile}
                    formId={DETAILS_FORM_ID}
                    onStateChange={handleDetailsState}
                    announce={announce}
                  />
                </div>
                <div style={formRise(0.25)}>
                  <PhoneCard profile={profile} onDirtyChange={onDirty.phone} announce={announce} />
                </div>
                <div style={formRise(0.35)}>
                  <IdentityCard
                    profile={profile}
                    onDirtyChange={onDirty.identity}
                    announce={announce}
                  />
                </div>
              </div>
            </div>
          )}

          {profile && showSaveBar && (
            <SaveBar formId={DETAILS_FORM_ID} canSave={details.canSave} saving={details.saving} />
          )}
        </div>
      </main>

      <p role="status" aria-live="polite" className="sr-only">
        {spoken}
      </p>
      <ProfileToast key={toast?.id} message={toast?.text} raised={showSaveBar} />

      <Footer />
    </div>
  )
}
