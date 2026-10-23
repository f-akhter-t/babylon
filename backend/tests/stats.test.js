// The accountability rule, without a database.
import test from 'node:test'
import assert from 'node:assert/strict'
import { departmentRows, statsFrom, weeklyReports, waitingLongest } from '../src/shared/service/stats.service.js'

const NOW = new Date('2026-10-23T12:00:00Z')
const DAY = 86400000
const daysAgo = (n) => new Date(NOW.getTime() - n * DAY)

// Three issues I can add up by hand.
const issues = [
  // Roads: reported 10 days ago, closed after 4 days (6 days ago)
  { title: 'A', category: 'Roads', status: 'resolved', createdAt: daysAgo(10), resolvedAt: daysAgo(6) },
  // Bridges also belongs to Roads & Highways: reported 20 days ago, closed after 6 days, reopened
  { title: 'B', category: 'Bridges', status: 'resolved', createdAt: daysAgo(20), resolvedAt: daysAgo(14), reopenedAt: daysAgo(13) },
  // Waste: still open, reported 30 days ago
  { title: 'C', category: 'Waste', status: 'open', priority: 'medium', createdAt: daysAgo(30) },
  // Other: has no department, counts nowhere
  { title: 'D', category: 'Other', status: 'open', createdAt: daysAgo(3) },
]

test('department rows add up by hand over 8 weeks', () => {
  const rows = departmentRows(issues, 8, NOW)
  const roads = rows.find((r) => r.name === 'Roads & Highways')
  assert.deepEqual(roads, { name: 'Roads & Highways', assigned: 2, resolved: 2, avgDays: 5, reopened: 1 })
  assert.deepEqual(rows.find((r) => r.name === 'Waste Management'), {
    name: 'Waste Management', assigned: 1, resolved: 0, avgDays: 0, reopened: 0,
  })
  assert.equal(rows.length, 4)
})

test('the stat cards are computed from the rows, weighted by resolved', () => {
  const stats = statsFrom(departmentRows(issues, 8, NOW))
  assert.deepEqual(stats, { received: 3, resolved: 2, avgDays: 5, reopenedPercent: 50 })
})

test('a shorter period only counts what happened inside it', () => {
  // 4 weeks = 28 days: issue C (30 days ago) is outside it
  const stats = statsFrom(departmentRows(issues, 4, NOW))
  assert.equal(stats.received, 2)
})

test('no resolved issues gives zeros, not NaN', () => {
  assert.deepEqual(statsFrom(departmentRows([], 8, NOW)), { received: 0, resolved: 0, avgDays: 0, reopenedPercent: 0 })
})

test('weekly has one entry per week and matches the department totals', () => {
  const weekly = weeklyReports(issues, 8, NOW)
  assert.equal(weekly.length, 8)
  assert.equal(weekly[0].week, 'W1')
  assert.equal(weekly.reduce((n, w) => n + w.received, 0), 3)
  assert.equal(weekly.reduce((n, w) => n + w.resolved, 0), 2)
})

test('waiting longest: unresolved only, longest first, no category Other', () => {
  const list = waitingLongest(issues, NOW)
  assert.deepEqual(list, [{ title: 'C', department: 'Waste Management', days: 30 }])
})

test('waiting longest flags reopened issues and keeps the top 4', () => {
  const many = Array.from({ length: 6 }, (_, i) => ({
    title: `I${i}`, category: 'Water', status: 'open', createdAt: daysAgo(i + 1),
    ...(i === 5 ? { verification: 'reopened' } : {}),
  }))
  const list = waitingLongest(many, NOW)
  assert.equal(list.length, 4)
  assert.equal(list[0].title, 'I5')
  assert.equal(list[0].reopened, true)
  assert.deepEqual(list.map((x) => x.days), [6, 5, 4, 3])
})
