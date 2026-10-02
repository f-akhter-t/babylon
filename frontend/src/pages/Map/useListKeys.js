import { useEffect } from 'react'

// Keyboard shortcuts: Escape closes the popup, the up and down arrow keys
// move through the list. Skipped while typing, and arrows are left alone
// on the map itself, where Leaflet uses them to pan.
export function useListKeys(issues, selectedId, onSelect) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target
      if (target.closest?.('input, textarea, select, [contenteditable="true"]')) return

      if (event.key === 'Escape') {
        onSelect(null)
        return
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
      if (target.closest?.('.leaflet-container') || issues.length === 0) return

      event.preventDefault()
      const index = issues.findIndex((issue) => issue.id === selectedId)
      const step = event.key === 'ArrowDown' ? 1 : -1
      let next
      if (index === -1) next = step === 1 ? 0 : issues.length - 1
      else next = Math.min(Math.max(index + step, 0), issues.length - 1)
      onSelect(issues[next].id)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [issues, selectedId, onSelect])
}
