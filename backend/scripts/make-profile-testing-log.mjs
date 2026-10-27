// Writes two testing logs from my Postman collections:
//   postman/citizen-profile-testing-log.md  (from citizen-profile.json)
//   postman/department-testing-log.md       (from department.json)
// One row per request. You send each request by hand, then tick the row.
// Run it again after a collection changes: ticked rows keep their tick.
// Run from the backend/ folder:  node scripts/make-profile-testing-log.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const JOBS = [
  { src: 'citizen-profile.json', out: 'citizen-profile-testing-log.md', title: 'Citizen profile testing log' },
  { src: 'department.json', out: 'department-testing-log.md', title: 'Department testing log' },
]
const file = (f) => new URL('../postman/' + f, import.meta.url)
const flatten = (items) => items.flatMap((i) => (i.item ? flatten(i.item) : [i]))
const textOf = (d) => (typeof d === 'string' ? d : (d?.content ?? '')).replace(/\s+/g, ' ').replace(/\|/g, '/').trim()
const pathOf = (u) => (typeof u === 'string' ? u : (u?.raw ?? '')).replace('{{baseUrl}}', '')

for (const job of JOBS) {
  const collection = JSON.parse(readFileSync(file(job.src), 'utf8'))
  const old = new Map()
  if (existsSync(file(job.out))) {
    for (const line of readFileSync(file(job.out), 'utf8').split('\n')) {
      const cells = line.split('|').map((c) => c.trim())
      if (cells.length >= 8 && /^\d+$/.test(cells[1])) old.set(cells[2].split(' - ').slice(1).join(' - '), cells.slice(4, 7))
    }
  }
  const rows = flatten(collection.item).map((r, i) => {
    const kept = old.get(r.name) ?? ['[ ]', '', '']
    const req = r.request.method + ' ' + pathOf(r.request.url) + ' - ' + r.name
    return '| ' + (i + 1) + ' | ' + req + ' | ' + textOf(r.request.description) + ' | ' + kept.join(' | ') + ' |'
  })
  const text = [
    '# ' + job.title,
    '',
    'Send each request in `' + job.src + '` by hand. Write `[x]` when the answer is what "Expected" says, add the date, and write what you saw if it was not. Reseed first when the Expected text says so. Ids in the URL (alerts) change after every reseed: copy a fresh id from the list response.',
    '',
    '| # | Request | Expected | Result | Date | Notes |',
    '|---|---|---|---|---|---|',
    ...rows,
    '',
  ].join('\n')
  writeFileSync(file(job.out), text)
  console.log(job.out + ': wrote ' + rows.length + ' rows.')
}
