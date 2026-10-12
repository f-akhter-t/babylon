// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom'
import Logo from './Logo'

const columns = [
  {
    title: 'Explore',
    links: [
      { label: 'Map', to: '/map' },
      { label: 'Issue feed', to: '/feed' },
      { label: 'Report an issue', to: '/report' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Log in', to: '/login' },
      { label: 'Sign up', to: '/signup' },
      { label: 'My reports', to: '/my-reports' },
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

export default function Footer() {
  return (
    <footer className="bg-navy px-5 pt-10 font-body text-white md:px-10 md:pt-12 xl:px-18">
      <div className="flex flex-col gap-10 md:flex-row md:justify-between">
        <div>
          <Logo />
          <p className="mt-3 text-white/80">Report. Track. Resolve.</p>
          <p className="mt-2 text-sm text-white/60">
            Map data © OpenStreetMap contributors
          </p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:gap-16">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-brand">
                {column.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="font-medium text-white transition-colors hover:text-brand"
                    >
                      {link.label}
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
        <p>© 2026 Babylon. All rights reserved.</p>
        <p>Frontend prototype</p>
      </div>
    </footer>
  )
}