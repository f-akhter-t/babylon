import { useMemo, useState } from 'react'

// Search, sort and paging for a list that is already loaded.
//   const view = useListView(items, { searchText, sorts, defaultSort, pageSize })
//   items       the rows, in the order the server ranked them
//   searchText  (item) => one string to search in (module level, so it is stable)
//   sorts       { key: { label, compare } }. compare is (a, b) => number, or
//               null to keep the server's order. Keep this object at module level too.
//   view        { query, setQuery, sortKey, setSortKey, page, setPage, pages, total, pageItems }
// Changing the search or the sort goes back to page 1. A page past the end
// (after the list gets shorter) shows the last page.
export function useListView(items, { searchText, sorts, defaultSort, pageSize = 25 }) {
  const [query, setQueryState] = useState('')
  const [sortKey, setSortKeyState] = useState(defaultSort)
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase()
    const list = text ? items.filter((item) => searchText(item).toLowerCase().includes(text)) : items
    const compare = sorts[sortKey]?.compare
    return compare ? [...list].sort(compare) : list
  }, [items, query, sortKey, searchText, sorts])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages)

  return {
    query,
    setQuery: (value) => {
      setQueryState(value)
      setPage(1)
    },
    sortKey,
    setSortKey: (value) => {
      setSortKeyState(value)
      setPage(1)
    },
    page: current,
    setPage,
    pages,
    total: filtered.length,
    pageItems: filtered.slice((current - 1) * pageSize, current * pageSize),
  }
}
