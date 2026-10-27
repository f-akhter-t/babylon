import { SearchIcon } from './MapIcons'
import { useT } from '../../i18n/useLanguage'

export default function SearchBox({ value, onChange }) {
  const t = useT()
  return (
    <label className="flex h-12 items-center gap-3 rounded-tile border border-navy/40 bg-white px-4 transition focus-within:border-navy focus-within:ring-4 focus-within:ring-brand/30">
      <SearchIcon className="shrink-0 text-slate" />
      <span className="sr-only">{t('Search street or landmark')}</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('Search street or landmark')}
        className="w-full bg-transparent text-base text-navy outline-none placeholder:text-muted"
      />
    </label>
  )
}
