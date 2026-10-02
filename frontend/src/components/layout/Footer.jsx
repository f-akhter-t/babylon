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
      { label: 'Log in', to: '/' }, // TODO: no login screen in the design yet
      { label: 'My reports', to: '/my-reports' },
      { label: 'Alerts', to: '/my-reports' },
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
    <footer className="flex justify-between bg-navy px-10 py-12 font-body text-white">
      <div>
        <Logo />
        <p className="mt-3 text-white/80">Report. Track. Resolve.</p>
        <p className="mt-2 text-sm text-white/60">
          Map data © OpenStreetMap contributors
        </p>
      </div>

      <div className="flex gap-16">
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
      </div>
    </footer>
  )
}