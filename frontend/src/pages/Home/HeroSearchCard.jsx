import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { ArrowRightIcon } from './HomeIcons'
import { useT } from '../../i18n/useLanguage'

// Search box on the right of the hero. It stays still while slides change.
// It opens the map page with the search in the link.
export default function HeroSearchCard({ categories = [] }) {
  const t = useT()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (category) params.set('category', category.toLowerCase())
    const text = params.toString()
    navigate(text ? `/map?${text}` : '/map')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-tile border border-soft bg-ink/80 p-6 backdrop-blur-md lg:w-[380px] xl:w-[400px]"
    >
      <h2 className="font-heading text-2xl font-extrabold text-frost">{t('Find issues near you')}</h2>

      <label
        htmlFor="hero-search"
        className="mt-6 block text-xs font-bold uppercase tracking-widest text-frost/70"
      >
        {t('Street or landmark')}
      </label>
      <input
        id="hero-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('e.g. Station Road')}
        className="mt-2 w-full border-b border-soft bg-transparent py-2 text-frost placeholder:text-frost/60 focus:border-brand focus:outline-none max-md:min-h-11"
      />

      <p className="mt-6 text-xs font-bold uppercase tracking-widest text-frost/70">{t('Category')}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {categories.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={category === name}
            onClick={() => setCategory((c) => (c === name ? null : name))}
            className={clsx(
              'rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors max-md:min-h-11',
              category === name
                ? 'border-brand bg-brand text-ink'
                : 'border-soft text-frost hover:border-mint',
            )}
          >
            {t(name)}
          </button>
        ))}
      </div>

      <button
        type="submit"
        className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 font-bold text-ink transition-opacity hover:opacity-90"
      >
        {t('Search the map')} <ArrowRightIcon className="size-[18px]" />
      </button>
    </form>
  )
}