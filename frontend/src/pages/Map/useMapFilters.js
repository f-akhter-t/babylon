import { useSearchParams } from 'react-router-dom'

// Filters and the selected issue live in the address bar, for example
// /map?category=Roads&status=open&q=mill&issue=3
// So the back button and shared links keep them.

export function useMapFilters() {
  const [params, setParams] = useSearchParams()
  const issue = params.get('issue')

  // One function for every change, so two changes at once don't overwrite each other.
  // "replace" updates the address without adding a new back-button step per click.
  const update = (changes) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        for (const [key, value] of Object.entries(changes)) {
          if (value === null || value === '' || value === 'All') next.delete(key)
          else next.set(key, String(value))
        }
        return next
      },
      { replace: true },
    )

  return {
    category: params.get('category') ?? 'All',
    status: params.get('status') ?? 'All',
    search: params.get('q') ?? '',
    selectedId: issue,
    update,
  }
}
