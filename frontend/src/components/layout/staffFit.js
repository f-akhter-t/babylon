import { useEffect, useState } from 'react'

// "Fit" mode for the staff pages: from lg up, when the window is at least
// 600px tall, the page is one screen high and long lists scroll inside their
// own regions, so the main buttons stay on screen. Narrower or shorter windows
// (and zoomed pages) scroll the whole page as usual.
//
// Tailwind has no height breakpoint, so every class below stacks lg: with a
// height query. They are written out in full (not built from strings) so
// Tailwind can find them. Keep the query in step with FIT_QUERY.
export const FIT_QUERY = '(min-width: 64rem) and (min-height: 37.5rem)'

export const fit = {
  // AdminLayout's <main>: one screen high. It still scrolls if a page cannot
  // fit (large text), so nothing is ever cut off.
  screen: 'lg:[@media(min-height:37.5rem)]:h-dvh lg:[@media(min-height:37.5rem)]:overflow-y-auto',
  // A page's top element: fills <main> as a column.
  page: 'lg:[@media(min-height:37.5rem)]:flex lg:[@media(min-height:37.5rem)]:h-full lg:[@media(min-height:37.5rem)]:flex-col',
  // A column inside a page that passes the height on to its children.
  column: 'lg:[@media(min-height:37.5rem)]:flex lg:[@media(min-height:37.5rem)]:min-h-0 lg:[@media(min-height:37.5rem)]:flex-col',
  // Takes the height that is left. Pair with a min-h-* from below so it never
  // collapses when the cards above it grow.
  grow: 'lg:[@media(min-height:37.5rem)]:flex-1',
  // A row of columns that all take the row's full height.
  stretch: 'lg:[@media(min-height:37.5rem)]:items-stretch',
  // Drops a fixed max height, so the list can use the height it is given instead.
  noMaxHeight: 'lg:[@media(min-height:37.5rem)]:max-h-none',
  // A single-row grid that fills the height it is given.
  rows: 'lg:[@media(min-height:37.5rem)]:grid-rows-1',
  // Scrolls inside itself (only in fit mode; otherwise the page scrolls).
  scroll: 'lg:[@media(min-height:37.5rem)]:overflow-y-auto lg:[@media(min-height:37.5rem)]:overscroll-contain',
  // For a scrolling panel with an action bar pinned to its bottom: a focused
  // field never scrolls to a spot under the bar.
  barPadding: 'lg:[@media(min-height:37.5rem)]:scroll-pb-28',
  // /department: heading and stat cards keep their height; the table takes the rest.
  departmentGrid: 'lg:[@media(min-height:37.5rem)]:h-full lg:[@media(min-height:37.5rem)]:grid-rows-[auto_auto_minmax(12rem,1fr)]',
  // Smallest heights for scrolling regions, so they stay usable.
  min32: 'lg:[@media(min-height:37.5rem)]:min-h-32',
  min48: 'lg:[@media(min-height:37.5rem)]:min-h-48',
  min64: 'lg:[@media(min-height:37.5rem)]:min-h-64',
  min80: 'lg:[@media(min-height:37.5rem)]:min-h-80',
}

// Focus ring for a scrolling region that gets tabIndex in fit mode.
export const REGION_FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

// true while fit mode is on. Use it for things CSS cannot do, such as giving
// a scrolling region tabIndex={0} only when it actually scrolls.
export function useFitMode() {
  const [on, setOn] = useState(() => window.matchMedia(FIT_QUERY).matches)
  useEffect(() => {
    const query = window.matchMedia(FIT_QUERY)
    const update = () => setOn(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return on
}
