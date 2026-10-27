// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom'
import Logo from './Logo'
import { useViewer } from '../../pages/Map/useViewer'
import { useT } from '../../i18n/useLanguage'

const columns = [
  {
    title: 'Explore',
    links: [
      { label: 'Map', to: '/map' },
      { label: 'Issue feed', to: '/feed' },
      { label: 'Report an issue', to: '/report', hideFor: 'staff' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Log in', to: '/login', hideFor: 'signedIn' },
      { label: 'Sign up', to: '/signup', hideFor: 'signedIn' },
      { label: 'My reports', to: '/my-reports', hideFor: 'staff' },
    ],
  },
  {
    title: 'For teams',
    links: [
      { label: 'Department panel', to: '/department' },
      { label: 'Admin review', to: '/admin/verify' },
      { label: 'Accountability', to: '/admin/accountability' },
    ],
  },
]

// hideFor: 'staff' hides citizen-only links from staff; 'signedIn' hides
// Log in and Sign up once someone is logged in. A column left empty is hidden.
function visibleColumns(role) {
  const isStaff = role === 'department' || role === 'admin'
  const signedIn = role !== 'guest'
  return columns
    .map((column) => ({
      ...column,
      links: column.links.filter(
        (link) =>
          !(link.hideFor === 'staff' && isStaff) && !(link.hideFor === 'signedIn' && signedIn),
      ),
    }))
    .filter((column) => column.links.length > 0)
}

export default function Footer() {
  const t = useT()
  const viewer = useViewer() // follows a login or logout in another tab

  return (
    <footer className="bg-navy px-5 pt-10 font-body text-white md:px-10 md:pt-12 xl:px-18">
      <div className="flex flex-col gap-10 md:flex-row md:justify-between">
        <div>
          <Logo />
          <p className="mt-3 text-white/80">{t('Report. Track. Resolve.')}</p>
          <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white/80">
            <svg viewBox="0 0 30 18" width="24" height="14" aria-hidden="true" className="rounded-[2px] ring-1 ring-white/25">
              <rect width="30" height="18" className="fill-flag-green" />
              <circle cx="13.5" cy="9" r="5" className="fill-flag-red" />
            </svg>
            {t('Made for all of Bangladesh')}
          </p>
          <p className="mt-2 text-sm text-white/60">
            {t('Map data © OpenStreetMap contributors')}
          </p>
        </div>

        <nav aria-label={t('Footer')} className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:gap-16">
          {/* Keeps the heading order right: the column titles below are h3. */}
          <h2 className="sr-only">{t('Site links')}</h2>
          {visibleColumns(viewer.role).map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-brand">
                {t(column.title)}
              </h3>
              <ul className="mt-1.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="inline-flex min-h-11 min-w-11 items-center font-medium text-white transition-colors hover:text-brand"
                    >
                      {t(link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Closing row */}
      <div className="mt-10 flex flex-col gap-2 border-t border-white/10 py-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
        <p>{t('© 2026 Babylon. All rights reserved.')}</p>
        <p>{t('Frontend prototype')}</p>
      </div>
    </footer>
  )
}