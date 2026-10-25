// Writes backend/postman/citizen-testing-log.md: one row for every request in
// citizen.json, with what to expect. You send each request by hand, then tick
// the row and write the date. Run it again after the collection changes: rows
// you already ticked keep their tick.
// Run from the backend/ folder:  node scripts/make-testing-log.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const COLLECTION = new URL('../postman/citizen.json', import.meta.url)
const LOG = new URL('../postman/citizen-testing-log.md', import.meta.url)

const collection = JSON.parse(readFileSync(COLLECTION, 'utf8'))
const expectedOf = (description = '') => {
  const line = description.split('\n').find((l) => l.startsWith('Expected:'))
  return (line ?? '').replace(/^Expected:\s*/, '').replace(/\|/g, '/')
}

// Keep earlier ticks: name -> the old "Result | Date | Notes" cells.
const old = new Map()
if (existsSync(LOG)) {
  for (const line of readFileSync(LOG, 'utf8').split('\n')) {
    const cells = line.split('|').map((c) => c.trim())
    if (cells.length >= 8 && /^\d+$/.test(cells[1])) old.set(cells[2], cells.slice(4, 7))
  }
}

const rows = []
for (const folder of collection.item) {
  for (const entry of folder.item ?? [folder]) {
    const kept = old.get(entry.name) ?? ['[ ]', '', '']
    rows.push(`| ${rows.length + 1} | ${entry.name} | ${expectedOf(entry.request?.description)} | ${kept.join(' | ')} |`)
  }
}

const text = [
  '# Citizen testing log',
  '',
  'Send each request in `citizen.json` by hand. Write `[x]` when the answer is what "Expected" says, add the date, and write what you saw if it was not.',
  '',
  '| # | Request | Expected | Result | Date | Notes |',
  '|---|---|---|---|---|---|',
  ...rows,
  '',
].join('\n')
writeFileSync(LOG, text)
console.log(`Wrote ${rows.length} rows.`)
