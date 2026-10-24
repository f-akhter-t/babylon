// The shared alerts service, with an in-memory Alert model (no database).
import test, { mock } from 'node:test'
import assert from 'node:assert/strict'

const url = (p) => new URL(p, import.meta.url).href

let rows = []
let seq = 0
const matches = (row, filter) => Object.entries(filter).every(([k, v]) => (v && v.$in ? v.$in.includes(row[k]) : String(row[k]) === String(v)))
const query = (list) => {
  let out = list
  const q = {
    sort: () => { out = [...out].sort((a, b) => b.createdAt - a.createdAt || b._seq - a._seq); return q },
    skip: (n) => { out = out.slice(n); return q },
    select: () => q,
    lean: async () => out.map((r) => ({ ...r })),
  }
  return q
}
const FakeAlert = {
  create: async (doc) => { const row = { ...doc, _id: String(++seq).padStart(24, '0'), _seq: seq, createdAt: new Date(2026, 0, 1, 0, 0, seq), read: false }; rows.push(row); return row },
  insertMany: async (docs) => Promise.all(docs.map((d) => FakeAlert.create(d))),
  find: (filter) => query(rows.filter((r) => matches(r, filter))),
  countDocuments: async (filter) => rows.filter((r) => matches(r, filter)).length,
  findOneAndUpdate: (filter, update) => ({
    lean: async () => {
      const row = rows.find((r) => matches(r, filter))
      if (!row) return null
      Object.assign(row, update.$set)
      return { ...row }
    },
  }),
  updateMany: async (filter, update) => { rows.filter((r) => matches(r, filter)).forEach((r) => Object.assign(r, update.$set)) },
  deleteMany: async (filter) => { rows = rows.filter((r) => !matches(r, filter)) },
}
mock.module(url('../src/models/alert.model.js'), { defaultExport: FakeAlert })
const alerts = await import('../src/shared/service/alerts.service.js')
const { ALERT_LIMITS } = await import('../src/constants/limits.js')

const reset = () => { rows = []; seq = 0 }
test('the cap of 50 comes from limits.js', () => {
  assert.equal(ALERT_LIMITS.keepNewest, 50)
})

test('only the newest 50 alerts are kept per account', async () => {
  reset()
  for (let i = 0; i < ALERT_LIMITS.keepNewest + 3; i += 1) {
    await alerts.notify('Admin@Babylon.test', { kind: 'fix-waiting', text: `n${i}` })
  }
  const { alerts: kept } = await alerts.listAlerts('admin@babylon.test')
  assert.equal(kept.length, 50)
  assert.equal(kept[0].text, 'n52')
})

test('list: own alerts only, newest first, with the unread count', async () => {
  reset()
  await alerts.notify('a@x.test', { kind: 'filed', text: 'first' })
  await alerts.notify('a@x.test', { kind: 'filed', text: 'second' })
  await alerts.notify('b@x.test', { kind: 'filed', text: 'not mine' })
  const result = await alerts.listAlerts('A@x.test')
  assert.deepEqual(result.alerts.map((a) => a.text), ['second', 'first'])
  assert.equal(result.unreadCount, 2)
})

test('unread count, mark one read, mark all read', async () => {
  reset()
  const one = await alerts.notify('a@x.test', { kind: 'filed', text: 'one' })
  await alerts.notify('a@x.test', { kind: 'filed', text: 'two' })
  assert.deepEqual(await alerts.getUnreadCount('a@x.test'), { unreadCount: 2 })
  const read = await alerts.markRead('a@x.test', one._id)
  assert.equal(read.read, true)
  assert.deepEqual(await alerts.getUnreadCount('a@x.test'), { unreadCount: 1 })
  assert.deepEqual(await alerts.markAllRead('a@x.test'), { unreadCount: 0 })
})

test('marking someone else\'s alert, or an unknown id, gives not-found', async () => {
  reset()
  const theirs = await alerts.notify('b@x.test', { kind: 'filed', text: 'theirs' })
  await assert.rejects(alerts.markRead('a@x.test', theirs._id), { code: 'not-found', status: 404 })
  await assert.rejects(alerts.markRead('a@x.test', 'nope'), { code: 'not-found', status: 404 })
})
