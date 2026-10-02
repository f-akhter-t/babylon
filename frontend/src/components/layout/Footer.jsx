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
    <footer className="flex flex-col gap-10 bg-navy px-5 py-10 font-body text-mint md:px-10 xl:flex-row xl:items-start xl:justify-between xl:px-18">
      <div>
        <Logo />
        <p className="mt-3 text-[15px] text-page">Report. Track. Resolve.</p>
        <p className="mt-3 text-[13px] text-page">
          Map data © OpenStreetMap contributors
        </p>
      </div>

      <div className="flex flex-wrap gap-x-12 gap-y-8 xl:gap-18">
        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-brand">
              {column.title}
            </h3>
            <ul className="mt-3 flex flex-col gap-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-[15px] font-semibold leading-tight text-mint transition-colors hover:text-brand"
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