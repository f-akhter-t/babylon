// The department seed's issues, in one place so seed.department.js and the
// shared seed.js build the same rows. Fixed ids, so Postman can use the same ids
// on every run.
import mongoose from 'mongoose'

const id = (n) => new mongoose.Types.ObjectId('a1b2c3'.padEnd(23, '0') + n)
const daysAgo = (n) => new Date(Date.now() - n * 86400000)
const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='


// overrides: change who filed them (the shared seed uses the public seed's
// demo citizen, so every script agrees on one "citizen@babylon.test").
export function buildDepartmentIssues(overrides = {}) {
  const base = {
    description: 'Seed issue for testing.',
    location: 'Test Street',
    division: 'Dhaka',
    reporter: 'Demo Citizen',
    reporterEmail: 'citizen@babylon.test',
    status: 'open',
    priority: 'medium',
    verification: 'none',
    ...overrides,
  }

  return [
    // 1 Roads, open: roads@ must see it. Use it for "start work".
    { ...base, _id: id(1), title: 'Pothole on Lake Road', category: 'Roads', beforeImg: PIXEL, createdAt: daysAgo(5) },
    // 2 Roads, in progress: use it for "submit for verification".
    { ...base, _id: id(2), title: 'Broken divider near market', category: 'Roads', status: 'in-progress', startedAt: daysAgo(2), beforeImg: PIXEL, createdAt: daysAgo(9) },
    // 3 Bridges, open: roads@ must see it (Bridges belongs to Roads & Highways).
    { ...base, _id: id(3), title: 'Cracked footbridge rail', category: 'Bridges', priority: 'high', createdAt: daysAgo(4) },
    // 4 Waste, open: roads@ must NOT see it.
    { ...base, _id: id(4), title: 'Overflowing bin at corner', category: 'Waste', createdAt: daysAgo(3) },
    // 5 Roads, reopened: must be left out of "assigned".
    { ...base, _id: id(5), title: 'Pothole came back on Mill Road', category: 'Roads', priority: 'reopened', verification: 'reopened', reopenedFrom: '10 Oct', reopenedAt: daysAgo(1), createdAt: daysAgo(20) },
    // 6 Roads, resolved: shows in "completed".
    { ...base, _id: id(6), title: 'Fixed drain cover', category: 'Roads', status: 'resolved', priority: 'fix-verified', verification: 'verified', startedAt: daysAgo(8), resolvedAt: daysAgo(3), afterImg: PIXEL, beforeImg: PIXEL, createdAt: daysAgo(12) },
  ]
}
