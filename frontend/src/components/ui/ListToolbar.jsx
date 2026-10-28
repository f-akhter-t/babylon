import { useT } from '../../i18n/useLanguage'

// A search box and a sort menu for a list (see hooks/useListView.js).
//   sorts: the same object the hook gets; each label is looked up in bn.js.
// onDark: for a dark section, so the "Sort by" label stays readable.
export default function ListToolbar({ view, sorts, searchLabel, placeholder, onDark = false }) {
  const t = useT()
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="relative min-w-0 flex-1 basis-56">
        <span className="sr-only">{searchLabel}</span>
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={view.query}
          onChange={(e) => view.setQuery(e.target.value)}
          placeholder={placeholder}
          className="min-h-11 w-full rounded-full border border-navy/40 bg-white py-2 pl-11 pr-4 font-body text-base text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </label>
      <label className={`flex items-center gap-2 font-body text-sm font-semibold ${onDark ? 'text-frost/80' : 'text-muted'}`}>
        {t('Sort by')}
        <select
          value={view.sortKey}
          onChange={(e) => view.setSortKey(e.target.value)}
          className="min-h-11 rounded-full border border-navy/40 bg-white px-4 py-2 font-body text-sm font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {Object.entries(sorts).map(([key, sort]) => (
            <option key={key} value={key}>
              {t(sort.label)}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
