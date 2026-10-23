// The public seed: the data it builds is valid for the real models, and running
// it twice gives the same rows (the "safe to run twice" promise). The database
// is replaced by a small in-memory store that behaves like an upsert.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import Issue from '../src/models/issue.model.js'
import User from '../src/models/user.model.js'
import { buildPublicSeed, seedPublic, DEMO_PASSWORD } from '../scripts/seedPublicData.js'

const NOW = new Date('2026-10-23T12:00:00Z')
const DAY = 86400000

test('the seed has the 12 sample issues and the 3 demo accounts', () => {
  const { users, issues } = buildPublicSeed(NOW)
  assert.equal(issues.length, 12)
  assert.deepEqual(users.map((u) => u.email), ['citizen@babylon.test', 'roads@babylon.test', 'admin@babylon.test'])
  assert.equal(users.find((u) => u.role === 'department').department, 'Roads & Highways')
})

test('every issue is valid for the real issue model', async () => {
  const { issues } = buildPublicSeed(NOW)
  for (const { doc } of issues) {
    await assert.doesNotReject(new Issue(doc).validate(), doc.title)
  }
})

test('every demo account is valid for the real user model', async () => {
  const { users } = buildPublicSeed(NOW)
  for (const user of users) {
    await assert.doesNotReject(new User({ ...user, passwordHash: 'x' }).validate(), user.email)
  }
})

test('votes: the total matches the pages, the reporter votes first, no duplicates', () => {
  const { issues } = buildPublicSeed(NOW)
  const totals = issues.map(({ voters }) => voters.length)
  assert.deepEqual(totals, [48, 27, 31, 19, 14, 52, 35, 22, 11, 6, 9, 7])
  for (const { doc, voters } of issues) {
    assert.equal(voters[0], doc.reporterEmail)
    assert.equal(new Set(voters).size, voters.length)
  }
})

test('dates are built from the clock and agree with each other', () => {
  const { issues } = buildPublicSeed(NOW)
  const first = issues[0].doc // reported 3 days ago
  assert.equal(first.createdAt.getTime(), NOW.getTime() - 3 * DAY)

  const fixed = issues.map((i) => i.doc).filter((d) => d.status === 'resolved')
  assert.equal(fixed.length, 3)
  for (const doc of fixed) {
    assert.ok(doc.afterImg && doc.resolvedAt > doc.createdAt)
    assert.equal(doc.verification, 'verified')
  }
  const waiting = issues.map((i) => i.doc).filter((d) => d.verification === 'awaiting')
  assert.equal(waiting.length, 3)
  for (const doc of waiting) assert.ok(doc.pendingAfterImg && doc.submittedAt > doc.startedAt)
})

test('the reopened issue is open, reopened, and says when it was first fixed', () => {
  const { issues } = buildPublicSeed(NOW)
  const reopened = issues.map((i) => i.doc).find((d) => d.verification === 'reopened')
  assert.equal(reopened.status, 'open')
  assert.equal(reopened.priority, 'reopened')
  assert.ok(reopened.reopenedFrom && reopened.reopenedAt)
})

test('no staff-only leftovers on issues that were never submitted', () => {
  const { issues } = buildPublicSeed(NOW)
  for (const { doc } of issues.filter(({ doc }) => doc.verification !== 'awaiting')) {
    assert.equal('pendingAfterImg' in doc, false, doc.title)
  }
})

// ---------- running it twice ----------

function fakeStore() {
  const users = new Map()
  const issues = new Map()
  const votes = new Map()
  return {
    users, issues, votes,
    User: {
      updateOne: async (filter, { $set }) => { users.set(filter.email, { ...users.get(filter.email), ...$set }) },
    },
    Issue: {
      findOneAndUpdate: (filter, { $set }) => {
        const key = `${filter.title}|${filter.reporterEmail}`
        const row = { _id: issues.get(key)?._id ?? new mongoose.Types.ObjectId(), ...issues.get(key), ...$set }
        issues.set(key, row)
        return { lean: async () => ({ _id: row._id }) }
      },
    },
    Vote: {
      bulkWrite: async (ops) => {
        for (const { updateOne: { filter } } of ops) votes.set(`${filter.issueId}|${filter.userEmail}`, filter)
      },
    },
  }
}

test('running the seed twice gives 3 accounts, 12 issues and 281 votes, once each', async () => {
  const store = fakeStore()
  const run = () => seedPublic({ ...store, hashPassword: async (text) => `hash(${text})`, now: NOW })

  const first = await run()
  assert.deepEqual(first, { users: 3, issues: 12, votes: 281 })
  const second = await run()
  assert.deepEqual(second, first)

  assert.equal(store.users.size, 3)
  assert.equal(store.issues.size, 12)
  assert.equal(store.votes.size, 281)
})

test('accounts get a hash, never the plain password', async () => {
  const store = fakeStore()
  await seedPublic({ ...store, hashPassword: async (text) => `hash(${text})`, now: NOW })
  for (const user of store.users.values()) {
    assert.equal(user.passwordHash, `hash(${DEMO_PASSWORD})`)
    assert.equal('password' in user, false)
  }
})
