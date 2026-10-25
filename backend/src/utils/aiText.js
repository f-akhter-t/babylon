// Small text helpers for AI answers. Pure functions, no imports.

// One line: every run of white space becomes a single space.
export const oneLine = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()

// At most `max` characters. Cuts at a word where it can and adds an ellipsis.
export function cut(text, max) {
  if (text.length <= max) return text
  const room = text.slice(0, max - 1)
  const space = room.lastIndexOf(' ')
  return `${(space > max / 2 ? room.slice(0, space) : room).replace(/[\s,;:.-]+$/, '')}…`
}