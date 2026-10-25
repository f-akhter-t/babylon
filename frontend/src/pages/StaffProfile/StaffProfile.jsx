import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import ChangePasswordCard from '../../components/ui/ChangePasswordCard'
import { useToast } from '../../components/ui/toast'
import RequireRole from '../Auth/RequireRole'
import { useViewer } from '../Map/useViewer'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useProfile } from '../../hooks/useProfile'
import { completeOnboarding, verifyEmployeeId } from '../../services/api'
import { homePathFor, isSetupPending } from '../../services/auth'
import ProfileCard from '../Profile/ProfileCard'
import PhoneCard from '../Profile/PhoneCard'
import JumpChips from '../Profile/JumpChips'
import SaveBar from '../Profile/SaveBar'
import { ProfileError, ProfileLoading } from '../Profile/ProfileStates'
import { useUnsavedChanges } from '../Profile/useUnsavedChanges'
import { enter } from '../../components/ui/motion'
import StaffDetailsCard from './StaffDetailsCard'
import DepartmentCodeCard from './DepartmentCodeCard'
import VerifyCodeCard from './VerifyCodeCard'
import ProfilePhotoCard from './ProfilePhotoCard'
import SetupChecklist from './SetupChecklist'

const LEAVE_MESSAGE = 'You have changes that are not saved. Leave this page anyway?'
const DETAILS_FORM_ID = 'staff-details-form'
const HEADING_ID = 'staff-profile-heading'
const GATE_BANNER_ID = 'staff-gate-banner'

// /department/profile and /admin/profile: each staff account's own profile.
// Until it is set up, this is the only page the account can open (see
// OnboardingGate), and the checklist's Finish setup button is the way out.
export default function StaffProfile({ role }) {
  return (
    <RequireRole role={role}>
      <StaffProfilePage role={role} />
    </RequireRole>
  )
}

function StaffProfilePage({ role }) {
  const { session } = useViewer()
  const { profile, loading, error, reload } = useProfile()
  const email = session.email
  // Read from the account itself, never from the session copy.
  const onboarded = profile?.email === email ? profile.onboarded : !isSetupPending()
  useDocumentTitle(onboarded ? 'Your profile' : 'Set up your profile')
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  // Sent here by the gate from another page: say why, and start at the heading.
  // Keyed on the arrival, not the state object: the unsaved-changes guard's
  // own Back step hands the router a new copy of the same state.
  const arrivedGated = Boolean(location.state?.gated)
  const gated = arrivedGated && !onboarded
  const headingRef = useRef(null)

  useEffect(() => {
    if (arrivedGated) headingRef.current?.focus()
  }, [location.key, arrivedGated])

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
      employeeId: (value) => markDirty('employeeId', value),
      department: (value) => markDirty('department', value),
    }),
    [markDirty],
  )
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

  // announce(text): read out by this page's live region. With { toast: true }
  // it is shown as a toast instead, which the Toaster reads out.
  const [spoken, setSpoken] = useState('')
  const timers = useRef([])
  const announce = useCallback(
    (text, { toast: showToast = false } = {}) => {
      if (showToast) {
        toast.info(text)
        return
      }
      setSpoken('')
      timers.current.push(setTimeout(() => setSpoken(text), 60))
    },
    [toast],
  )
  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const showSaveBar = details.dirty
  useEffect(() => {
    if (!showSaveBar) return
    const root = document.documentElement
    root.style.scrollPaddingBottom = '6rem'
    return () => {
      root.style.scrollPaddingBottom = ''
    }
  }, [showSaveBar])

  async function finishSetup() {
    await completeOnboarding(email)
    toast.info('Your profile is set up.')
    navigate(homePathFor(role))
  }

  const isDepartment = role === 'department'
  const sections = [
    { label: 'Details', id: 'staff-details' },
    { label: 'Phone', id: 'profile-phone' },
    { label: 'Employee ID', id: 'staff-employee-id' },
    ...(isDepartment ? [{ label: 'Department', id: 'staff-department' }] : []),
    { label: 'Photo', id: 'staff-photo' },
    { label: 'Security', id: 'profile-security' },
  ]
  const ready = profile?.email === email

  return (
    <AdminLayout variant={role} active="Profile" department={session.department}>
      <div className="px-4 pt-6 pb-8 sm:px-6 md:px-10 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-5xl">
          <div style={enter('rise-in', 0)}>
            <h1
              id={HEADING_ID}
              ref={headingRef}
              tabIndex={-1}
              aria-describedby={gated ? GATE_BANNER_ID : undefined}
              className="w-fit max-w-full rounded-chip break-words font-heading text-3xl font-extrabold text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/50 sm:text-4xl"
            >
              {onboarded ? 'Your profile' : 'Set up your profile'}
            </h1>
            <p className="mt-1 font-body text-sm text-slate">
              {onboarded
                ? 'Keep your details up to date so citizens and other staff know who is handling their reports.'
                : isDepartment
                  ? 'Before you start, add your job title and verify your phone number, your Employee ID and your department.'
                  : 'Before you start, add your job title and verify your phone number and your Employee ID.'}
            </p>
          </div>

          {gated && (
            <p
              id={GATE_BANNER_ID}
              className="mt-4 rounded-tile border border-amber bg-amber/20 px-4 py-3 font-body text-sm font-semibold text-navy"
            >
              Finish setting up your profile to continue.
            </p>
          )}

          {ready && (
            <div style={enter('rise-in', 0.05)}>
              <JumpChips sections={sections} />
            </div>
          )}

          {loading && <ProfileLoading />}
          {!loading && !ready && error && <ProfileError onRetry={reload} />}

          {ready && (
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
              {!onboarded && (
                <div className="lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1" style={enter('rise-in', 0.1)}>
                  <SetupChecklist
                    profile={profile}
                    detailsDirty={details.dirty}
                    onFinish={finishSetup}
                  />
                </div>
              )}

              <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
                <div style={enter('rise-in', 0.15)}>
                  <StaffDetailsCard
                    profile={profile}
                    formId={DETAILS_FORM_ID}
                    onStateChange={handleDetailsState}
                    announce={announce}
                  />
                </div>
                <div style={enter('rise-in', 0.2)}>
                  <PhoneCard
                    profile={profile}
                    onDirtyChange={onDirty.phone}
                    announce={announce}
                    intro="Your team can reach you on this number. We check it with a one-time code."
                  />
                </div>
                <div style={enter('rise-in', 0.22)}>
                  <VerifyCodeCard
                    id="staff-employee-id"
                    inputId="staff-employee-id-input"
                    title="Employee ID"
                    intro="Enter the ID from your staff card once, so we know this account is really yours."
                    note={
                      onboarded && !profile.employeeIdVerified
                        ? 'Your account is already set up. Please verify your Employee ID when you can.'
                        : undefined
                    }
                    badgeLabel="Employee ID verified"
                    label="Employee ID"
                    hint="Your Employee ID is on your staff card."
                    verified={profile.employeeIdVerified}
                    done={{ label: 'Your Employee ID', value: profile.employeeId }}
                    verify={async (code) => (await verifyEmployeeId(email, code)).employeeId}
                    successText="Your Employee ID is verified."
                    onDirtyChange={onDirty.employeeId}
                    announce={announce}
                  />
                </div>
                {isDepartment && (
                  <div style={enter('rise-in', 0.25)}>
                    <DepartmentCodeCard
                      profile={profile}
                      onDirtyChange={onDirty.department}
                      announce={announce}
                    />
                  </div>
                )}
                <div style={enter('rise-in', 0.3)}>
                  <ProfilePhotoCard profile={profile} announce={announce} />
                </div>
                <div style={enter('rise-in', 0.35)}>
                  <ProfileCard
                    id="profile-security"
                    title="Security"
                    intro="Change the password you use to log in. You stay logged in on this device."
                  >
                    <ChangePasswordCard email={email} />
                  </ProfileCard>
                </div>
              </div>
            </div>
          )}

          {ready && showSaveBar && (
            <SaveBar formId={DETAILS_FORM_ID} canSave={details.canSave} saving={details.saving} />
          )}
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {spoken}
      </p>
    </AdminLayout>
  )
}
