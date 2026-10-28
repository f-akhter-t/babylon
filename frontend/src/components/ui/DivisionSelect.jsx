import { DIVISIONS } from '../../utils/divisions'
import { useT } from '../../i18n/useLanguage'

// "All divisions" plus the 8 divisions. value is '' for all of Bangladesh.
// onDark: for a dark section, so the label stays readable.
export default function DivisionSelect({ value, onChange, onDark = false }) {
  const t = useT()
  return (
    <label
      className={`flex items-center gap-2 font-body text-sm font-semibold ${onDark ? 'text-frost/80' : 'text-muted'}`}
    >
      {t('Division')}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 rounded-full border border-navy bg-white px-4 py-2 font-body text-sm font-bold text-navy focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <option value="">{t('All divisions')}</option>
        {DIVISIONS.map((name) => (
          <option key={name} value={name}>
            {t(name)}
          </option>
        ))}
      </select>
    </label>
  )
}
