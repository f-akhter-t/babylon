// cleanSeed removes the demo rows (emails ending in .test) and leaves real ones.
// The database is replaced by a small in-memory store.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanSeed, SEED_EMAIL } from '../scripts/cleanSeedData.js'

const same = (a, b) => String(a) === String(b)

function matches(doc, filter) {
  return Object.entries(filter).every(([key, want]) => {
    if (key === '$or') return want.some((part) => matches(doc, part))
    const have = doc[key]
    if (want instanceof RegExp) return typeof have === 'string' && want.test(have)
    if (want && typeof want === 'object' && '$in' in want) return want.$in.some((value) => same(value, have))
    return same(have, want)
  })
}

function store(rows) {
  return {
    rows,
    find: (filter) => ({ select: () => ({ lean: async () => rows.filter((row) => matches(row, filter)) }) }),
    countDocuments: async (filter) => rows.filter((row) => matches(row, filter)).length,
    deleteMany: async (filter) => {
      for (let i = rows.length - 1; i >= 0; i--) if (matches(rows[i], filter)) rows.splice(i, 1)
    },
  }
}

function world() {
  return {
    User: store([
      { _id: 'u1', email: 'citizen@babylon.test' },
      { _id: 'u2', email: 'nadia@seed-admin.test' },
      { _id: 'u3', email: 'sara@gmail.com' },
    ]),
    Issue: store([
      { _id: 'i1', reporterEmail: 'citizen@babylon.test' },
      { _id: 'i2', reporterEmail: 'nadia@seed-admin.test' },
      { _id: 'i3', reporterEmail: 'sara@gmail.com' },
    ]),
    Vote: store([
      { issueId: 'i1', userEmail: 'sara@gmail.com' }, // a real vote on a demo report
      { issueId: 'i3', userEmail: 'citizen@babylon.test' }, // a demo vote on a real report
      { issueId: 'i3', userEmail: 'sara@gmail.com' }, // real on real
    ]),
    Alert: store([
      { recipient: 'sara@gmail.com', issueId: 'i2' }, // about a demo report
      { recipient: 'citizen@babylon.test', issueId: null },
      { recipient: 'sara@gmail.com', issueId: 'i3' },
    ]),
    Identity: store([
      { userEmail: 'nadia@seed-admin.test' },
      { userEmail: 'sara@gmail.com' },
    ]),
    EmailCode: store([
      { userId: 'u1', email: 'citizen@babylon.test' },
      { userId: 'u3', email: 'sara@gmail.com' },
    ]),
    PhoneCode: store([{ userId: 'u2' }, { userId: 'u3' }]),
  }
}

test('only addresses ending in .test count as demo data', () => {
  assert.equal(SEED_EMAIL.test('citizen@babylon.test'), true)
  assert.equal(SEED_EMAIL.test('NADIA@Seed-Admin.TEST'), true)
  assert.equal(SEED_EMAIL.test('sara@gmail.com'), false)
  assert.equal(SEED_EMAIL.test('test@gmail.com'), false)
  assert.equal(SEED_EMAIL.test('a@testing.com'), false)
})

test('without apply it counts and deletes nothing', async () => {
  const models = world()
  const before = Object.values(models).map((model) => model.rows.length)
  const counts = await cleanSeed(models)
  assert.deepEqual(Object.values(models).map((model) => model.rows.length), before)
  assert.deepEqual(counts, {
    votes: 2, alerts: 2, identities: 1, emailCodes: 1, phoneCodes: 1, issues: 2, users: 2,
  })
})

test('with apply it removes the demo rows and keeps every real one', async () => {
  const models = world()
  const counts = await cleanSeed(models, { apply: true })
  assert.equal(counts.users, 2)
  assert.deepEqual(models.User.rows.map((row) => row.email), ['sara@gmail.com'])
  assert.deepEqual(models.Issue.rows.map((row) => row._id), ['i3'])
  assert.deepEqual(models.Vote.rows, [{ issueId: 'i3', userEmail: 'sara@gmail.com' }])
  assert.deepEqual(models.Alert.rows, [{ recipient: 'sara@gmail.com', issueId: 'i3' }])
  assert.deepEqual(models.Identity.rows, [{ userEmail: 'sara@gmail.com' }])
  assert.deepEqual(models.EmailCode.rows, [{ userId: 'u3', email: 'sara@gmail.com' }])
  assert.deepEqual(models.PhoneCode.rows, [{ userId: 'u3' }])
})

test('running it twice is safe: the second run finds nothing', async () => {
  const models = world()
  await cleanSeed(models, { apply: true })
  const again = await cleanSeed(models, { apply: true })
  assert.deepEqual(Object.values(again), [0, 0, 0, 0, 0, 0, 0])
})

test('a database with no demo rows is left as it is', async () => {
  const models = {
    User: store([{ _id: 'u3', email: 'sara@gmail.com' }]),
    Issue: store([{ _id: 'i3', reporterEmail: 'sara@gmail.com' }]),
    Vote: store([{ issueId: 'i3', userEmail: 'sara@gmail.com' }]),
    Alert: store([]), Identity: store([]), EmailCode: store([]), PhoneCode: store([]),
  }
  const counts = await cleanSeed(models, { apply: true })
  assert.deepEqual(Object.values(counts), [0, 0, 0, 0, 0, 0, 0])
  assert.equal(models.User.rows.length + models.Issue.rows.length + models.Vote.rows.length, 3)
})
