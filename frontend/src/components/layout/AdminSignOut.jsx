import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { getSession, isOnboarded, logout, STAFF_ROLES } from '../../services/auth'
import { confirmLeave } from '../../utils/leaveGuard'

// Who is signed in, and a Log out button. Works in any staff layout.
export default function AdminSignOut({ className }) {
  const navigate = useNavigate()
  const session = getSession()
  const roleLabel = STAFF_ROLES.find((r) => r.id === session?.role)?.label

  function handleLogout() {
    // Unsaved changes on this page: ask first. Not during the profile setup,
    // where Log out is the only way out and must never be held up.
    const settingUp = session && !isOnboarded(session.email)
    if (!settingUp && !confirmLeave()) return
    logout()
    navigate('/staff/login')
  }

  return (
    <div className={clsx('px-2', className)}>
      {session && (
        <p className="font-body text-sm text-mint">
          {roleLabel
            ? `Signed in as ${session.name} (${roleLabel}).`
            : `Signed in as ${session.name}.`}
        </p>
      )}
      <button
        type="button"
        onClick={handleLogout}
        className="mt-2 min-h-11 w-full rounded-full border border-mint/40 px-4 py-2.5 font-body text-sm font-bold text-mint transition-colors hover:bg-mint/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint motion-reduce:transition-none"
      >
        Log out
      </button>
    </div>
  )
}
