import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { ArrowRightIcon } from './HomeIcons'

// Search box on the right of the hero. It stays still while slides change.
// It opens the map page with the search in the link.
export default function HeroSearchCard({ categories = [] }) {
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
      className="w-full rounded-tile border border-slate bg-navy/80 p-6 backdrop-blur-md lg:w-[380px] xl:w-[400px]"
    >
      <h2 className="font-heading text-2xl font-extrabold text-mint">Find issues near you</h2>

      <label
        htmlFor="hero-search"
        className="mt-6 block text-xs font-bold uppercase tracking-widest text-mint/70"
      >
        Street or landmark
      </label>
      <input
        id="hero-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. Station Road"
        className="mt-2 w-full border-b border-slate bg-transparent py-2 text-mint placeholder:text-mint/60 focus:border-brand focus:outline-none"
      />

      <p className="mt-6 text-xs font-bold uppercase tracking-widest text-mint/70">Category</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {categories.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={category === name}
            onClick={() => setCategory((c) => (c === name ? null : name))}
            className={clsx(
              'rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors',
              category === name
                ? 'border-brand bg-brand text-navy'
                : 'border-slate text-mint hover:border-mint',
            )}
          >
            {name}
          </button>
        ))}
      </div>

      <button
        type="submit"
        className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 font-bold text-navy transition-opacity hover:opacity-90"
      >
        Search the map <ArrowRightIcon className="size-[18px]" />
      </button>
    </form>
  )
}