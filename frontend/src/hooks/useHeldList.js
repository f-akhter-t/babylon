import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { usePoliteMessage } from './usePoliteMessage'
import { useT } from '../i18n/useLanguage'

// Keeps a live list steady while someone is using it, so nothing jumps under
// the pointer. The list is "held" while it is scrolled past its top, or while
// the pointer or keyboard focus is inside it. While held:
//   - a changed report updates in place (the order waits),
//   - a removed report keeps its slot as a faded, inert ghost,
//   - new reports wait behind a "Show N new reports" button.
// Otherwise (or on release) the list simply takes the fresh data.
// Only live updates are held: the first load, a reload and a new resetKey
// (new filters, sort or search) always take fresh data at once.
// items must be the loaded array itself (the same array until it reloads);
// add each viewer's own votes afterwards, so a vote never reorders anything.
//
//   const held = useHeldList(items, { containerRef, resetKey, update, headingRef })
//   update: the update from useLiveIssues (null for a first load or new filters)
//   held.items       the items to draw, in their held order
//   held.isGhost(id) true for a removed report still holding its slot
//   held.waiting     how many new reports wait
//   held.showNew()   take the fresh data now (the button)
//   held.message     a sentence for a polite live region, or ''
//
// Each item's element needs data-live-id={id}, so focus can be moved off a
// report that was removed.
const TOP_GAP = 88 // px under the sticky navbar that still counts as "at the top"

export function useHeldList(items, { containerRef, scrollerRef, resetKey, update, headingRef }) {
  const live = Boolean(update)
  const remote = Boolean(update?.remote)
  const [state, setState] = useState(() => ({ resetKey, items, ghosts: new Set(), waiting: [], source: items }))
  const t = useT()
  const [message, say] = usePoliteMessage()
  const pointerInside = useRef(false)
  const latest = useRef(items)
  const focusAfter = useRef(null) // id of the report that should take focus, or 'heading'
  useLayoutEffect(() => {
    latest.current = items
  })

  // A first load, a reload or new filters: take the items at once, during
  // render, so the list is drawn once (a layout effect would draw it twice).
  if ((!live || resetKey !== state.resetKey) && (state.source !== items || state.resetKey !== resetKey)) {
    setState({ resetKey, items, ghosts: new Set(), waiting: [], source: items })
  }

  const isHeld = useCallback(() => {
    const box = containerRef.current
    if (!box) return false
    if (pointerInside.current || box.contains(document.activeElement)) return true
    const scroller = scrollerRef?.current
    if (scroller && scroller.scrollHeight > scroller.clientHeight + 1) return scroller.scrollTop > 8
    return box.getBoundingClientRect().top < TOP_GAP
  }, [containerRef, scrollerRef])

  // New data arrived. Decide before paint, while the old DOM is still there,
  // so a focused report that is about to fade out can hand its focus on.
  // The decision reads the page (scroll, focus, pointer), which is what a
  // layout effect is for, hence the setState calls in it.
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    // Only live updates are decided here; the rest was taken during render.
    if (items === state.source || !live || resetKey !== state.resetKey) return
    const fresh = new Map(items.map((item) => [String(item.id), item]))
    const shownIds = new Set(state.items.map((item) => String(item.id)))
    const hasWaiting = state.waiting.length > 0 || state.ghosts.size > 0

    if (!isHeld() && !hasWaiting) {
      setState({ resetKey, items, ghosts: new Set(), waiting: [], source: items })
      return
    }

    const ghosts = new Set(state.ghosts)
    for (const id of shownIds) if (!fresh.has(id)) ghosts.add(id)
    const waiting = items.filter((item) => !shownIds.has(String(item.id)))
    const kept = state.items.map((item) => fresh.get(String(item.id)) ?? item)

    // Focus inside a report that just became a ghost: pass it to the next
    // report still showing, or to the list heading.
    const active = document.activeElement
    const box = containerRef.current
    const focusedId = box?.contains(active) ? active.closest('[data-live-id]')?.dataset.liveId : null
    if (focusedId && ghosts.has(focusedId) && !state.ghosts.has(focusedId)) {
      const at = kept.findIndex((item) => String(item.id) === focusedId)
      const next = [...kept.slice(at + 1), ...kept.slice(0, at).reverse()].find((item) => !ghosts.has(String(item.id)))
      focusAfter.current = next ? String(next.id) : 'heading'
      say(t('A report was removed.'))
    }
    if (remote && waiting.length > state.waiting.length) {
      say(
        waiting.length === 1
          ? t('1 new report is ready to show.')
          : t('{count} new reports are ready to show.', { count: waiting.length }),
      )
    }
    setState({ resetKey, items: kept, ghosts, waiting, source: items })
  }, [items, resetKey, live, remote, state, isHeld, containerRef, say, t])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Move focus once the ghost is drawn (it is inert, so focus cannot stay).
  useEffect(() => {
    const target = focusAfter.current
    if (!target) return
    focusAfter.current = null
    if (target === 'heading') {
      headingRef?.current?.focus({ preventScroll: true })
      return
    }
    const card = containerRef.current?.querySelector(`[data-live-id="${CSS.escape(target)}"]`)
    // preventScroll: the neighbour is right there, and the list must not move.
    card?.querySelector('a[href], button:not([disabled])')?.focus({ preventScroll: true })
  })

  // Take the fresh data. Returns the ids that were waiting (to focus the first).
  const showNew = useCallback(() => {
    const fresh = latest.current
    setState((prev) => ({ resetKey: prev.resetKey, items: fresh, ghosts: new Set(), waiting: [], source: fresh }))
    return state.waiting.map((item) => String(item.id))
  }, [state.waiting])

  // Let go once nobody is using the list: the pointer and focus have left it
  // and it is back at its top. New reports then come in where they belong.
  useEffect(() => {
    const box = containerRef.current
    if (!box) return
    const scroller = scrollerRef?.current
    const tryRelease = () => {
      if (isHeld()) return
      setState((prev) => {
        if (prev.waiting.length === 0 && prev.ghosts.size === 0 && prev.source === latest.current) return prev
        const fresh = latest.current
        return { resetKey: prev.resetKey, items: fresh, ghosts: new Set(), waiting: [], source: fresh }
      })
    }
    const onEnter = () => {
      pointerInside.current = true
    }
    const onLeave = () => {
      pointerInside.current = false
      tryRelease()
    }
    const onFocusOut = () => setTimeout(tryRelease, 0)
    box.addEventListener('pointerenter', onEnter)
    box.addEventListener('pointerleave', onLeave)
    box.addEventListener('focusout', onFocusOut)
    const scrollTarget = scroller ?? window
    scrollTarget.addEventListener('scroll', tryRelease, { passive: true })
    return () => {
      box.removeEventListener('pointerenter', onEnter)
      box.removeEventListener('pointerleave', onLeave)
      box.removeEventListener('focusout', onFocusOut)
      scrollTarget.removeEventListener('scroll', tryRelease)
    }
  }, [containerRef, scrollerRef, isHeld])

  // A new filter shows its own list straight away.
  const current = state.resetKey === resetKey ? state : { items, ghosts: new Set(), waiting: [] }

  return {
    items: current.items,
    isGhost: (id) => current.ghosts.has(String(id)),
    waiting: current.waiting.length,
    showNew,
    message,
  }
}
