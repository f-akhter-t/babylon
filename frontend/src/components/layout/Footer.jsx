// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom'
import Logo from './Logo'
import FlagStripe from './FlagStripe'
import { useViewer } from '../../pages/Map/useViewer'
import { corner, MOTIFS } from '../../utils/alponaArt'
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

// The same line art as the home page hero, very faint and not animated: the
// vine alpona in the top-right corner and the four drawings along the bottom.
// Built from our own drawing code (no user input).
const FOOTER_ART = { corner: corner(), motifs: MOTIFS.map((make) => make()) }
const artProps = {
  viewBox: '0 0 400 400',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function FooterArt() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden text-brand">
      <svg
        {...artProps}
        className="absolute -right-3 -top-3 w-[200px] max-w-none opacity-[0.18] [mask-image:linear-gradient(to_top_left,black_35%,transparent_85%)] [transform:scale(-1,-1)] lg:w-[230px]"
        dangerouslySetInnerHTML={{ __html: FOOTER_ART.corner }}
      />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-around gap-2 px-4 opacity-[0.15] [mask-image:linear-gradient(to_top,black_20%,transparent_90%)]">
        {FOOTER_ART.motifs.map((art, i) => (
          <svg
            key={i}
            {...artProps}
            className={`w-1/2 max-w-[170px] sm:w-1/4 ${i > 1 ? 'max-sm:hidden' : ''}`}
            dangerouslySetInnerHTML={{ __html: art }}
          />
        ))}
      </div>
    </div>
  )
}

export default function Footer() {
  const t = useT()
  const viewer = useViewer() // follows a login or logout in another tab

  return (
    <footer className="relative isolate overflow-hidden bg-ink font-body text-paper">
      <FooterArt />
      <FlagStripe />
      <div className="relative px-5 pt-10 md:px-10 md:pt-12 xl:px-18">
      <div className="flex flex-col gap-10 md:flex-row md:justify-between">
        <div>
          <Logo />
          <p className="mt-3 text-paper/80">{t('Report. Track. Resolve.')}</p>
          <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-paper/80">
            <svg viewBox="0 0 30 18" width="24" height="14" aria-hidden="true" className="rounded-[2px] ring-1 ring-paper/25">
              <rect width="30" height="18" className="fill-flag-green" />
              <circle cx="13.5" cy="9" r="5" className="fill-flag-red" />
            </svg>
            {t('Made for all of Bangladesh')}
          </p>
          <p className="mt-2 text-sm text-paper/60">
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
                      className="inline-flex min-h-11 min-w-11 items-center font-medium text-paper transition-colors hover:text-brand"
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
      <div className="mt-10 flex flex-col gap-2 border-t border-paper/10 py-6 text-sm text-paper/60 sm:flex-row sm:items-center sm:justify-between">
        <p>{t('© 2026 Babylon. All rights reserved.')}</p>
        <p>{t('Frontend prototype')} · {t('Made in Bangladesh')}</p>
      </div>
      </div>
    </footer>
  )
}