import { Navigate } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import RequireRole from '../Auth/RequireRole'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { getSession, isSetupPending, profilePathFor } from '../../services/auth'
import { enter } from '../../components/ui/motion'
import { useT } from '../../i18n/useLanguage'
import StaffDashboard from './StaffDashboard'

// The first page after a staff member signs in: an overview of their work.
// An account that has not finished its profile goes there first.
function DashboardPage({ role }) {
  const t = useT()
  useDocumentTitle('Dashboard')
  const session = getSession()

  if (isSetupPending()) return <Navigate to={profilePathFor(role)} replace />

  return (
    <AdminLayout variant={role} active="Dashboard" department={session?.department}>
      <div className="px-4 pt-6 pb-8 sm:px-6 md:px-10 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl">
          <div style={enter('rise-in', 0)}>
            <h1 className="font-heading text-4xl font-extrabold text-navy sm:text-5xl">
              {t('Dashboard')}
            </h1>
            <p className="mt-2 font-body text-base text-slate">
              {t('Welcome back, {name}. Here is where things stand.', { name: session?.name ?? '' })}
            </p>
          </div>
          <StaffDashboard role={role} department={session?.department} />
        </div>
      </div>
    </AdminLayout>
  )
}

export default function StaffDashboardPage({ role }) {
  return (
    <RequireRole role={role}>
      <DashboardPage role={role} />
    </RequireRole>
  )
}
