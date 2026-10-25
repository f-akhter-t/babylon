// Reopen: the rules, with fake models and a fake notice sender.
import { test } from 'node:test'
import assert from 'node:assert/strict'

const { createReopenService } = await import('../src/citizen/service/reopen.service.js')

const ID = '64b7f0f0f0f0f0f0f0f0f0f0'
const NOW = new Date('2026-10-25T10:00:00Z')

// A tiny fake of Issue: findById().select().lean() and findOneAndUpdate().select().lean().
function world(issue, { admins = ['admin@babylon.test'], failNotify = false } = {}) {
  const calls = { update: [], notify: [], notifyMany: [] }
  let stored = issue ? { _id: ID, ...issue } : null
  const chain = (get) => ({ select: () => ({ lean: async () => get() }) })
  const Issue = {
    findById: () => chain(() => (stored ? { ...stored } : null)),
    findOneAndUpdate: (filter, update) => {
      calls.update.push({ filter, update })
      const ok = stored && stored.status === filter.status && stored.verification !== filter.verification.$ne
      if (ok) stored = { ...stored, ...update.$set }
      return chain(() => (ok ? { ...stored } : null))
    },
  }
  const User = { find: () => ({ distinct: async () => admins }) }
  const send = (name) => async (...args) => {
    if (failNotify) throw new Error('mail down')
    calls[name].push(args)
  }
  const service = createReopenService({
    getDeps: async () => ({ Issue, User, notify: send('notify'), notifyMany: send('notifyMany') }),
    now: () => NOW,
  })
  return { service, calls, get: () => stored }
}

const citizen = { email: 'other@babylon.test', role: 'citizen' }
const resolved = { title: 'Pothole', status: 'resolved', verification: 'verified', priority: 'fix-verified', reporterEmail: 'citizen@babylon.test' }

test('a resolved report is reopened: reopened priority and verification, reopenedAt set', async () => {
  const w = world(resolved)
  const out = await w.service.reopenReport(citizen, ID)
  assert.equal(out.verification, 'reopened')
  assert.equal(out.priority, 'reopened')
  assert.equal(out.status, 'resolved', 'the admin decides what happens next')
  assert.deepEqual(out.reopenedAt, NOW)
  assert.deepEqual(w.calls.update[0].filter, { _id: ID, status: 'resolved', verification: { $ne: 'reopened' } })
})

test('admins get a reopen notice; the reporter gets one too when somebody else reopened it', async () => {
  const w = world(resolved, { admins: ['a@x.test', 'b@x.test'] })
  await w.service.reopenReport(citizen, ID)
  assert.equal(w.calls.notifyMany.length, 1)
  assert.deepEqual(w.calls.notifyMany[0][0], ['a@x.test', 'b@x.test'])
  assert.equal(w.calls.notifyMany[0][1].kind, 'reopen')
  assert.equal(w.calls.notifyMany[0][1].link, '/admin/verify')
  assert.equal(w.calls.notify.length, 1)
  assert.equal(w.calls.notify[0][0], 'citizen@babylon.test')
  assert.equal(w.calls.notify[0][1].kind, 'reopen')
})

test('the reporter reopening their own report gets no notice about it', async () => {
  const w = world(resolved)
  await w.service.reopenReport({ email: 'Citizen@Babylon.test', role: 'citizen' }, ID)
  assert.equal(w.calls.notify.length, 0)
  assert.equal(w.calls.notifyMany.length, 1)
})

test('an open or in-progress report gives 409 and changes nothing', async () => {
  for (const status of ['open', 'in-progress']) {
    const w = world({ ...resolved, status, verification: 'none' })
    await assert.rejects(w.service.reopenReport(citizen, ID), (e) => e.status === 409 && e.code === 'conflict')
    assert.equal(w.calls.update.length, 0)
  }
})

test('a report that is already reopened gives 409 (a second click does nothing)', async () => {
  const w = world({ ...resolved, verification: 'reopened', priority: 'reopened' })
  await assert.rejects(w.service.reopenReport(citizen, ID), (e) => e.status === 409)
  assert.equal(w.calls.update.length, 0)
})

test('two quick clicks: the second one loses the race and gets 409', async () => {
  const w = world(resolved)
  await w.service.reopenReport(citizen, ID)
  await assert.rejects(w.service.reopenReport(citizen, ID), (e) => e.status === 409)
})

test('an unknown or malformed id gives 404', async () => {
  const w = world(null)
  await assert.rejects(w.service.reopenReport(citizen, ID), (e) => e.status === 404 && e.code === 'not-found')
  await assert.rejects(w.service.reopenReport(citizen, 'not-an-id'), (e) => e.status === 404)
})

test('a notice that fails does not undo the reopen', async () => {
  const w = world(resolved, { failNotify: true })
  const out = await w.service.reopenReport(citizen, ID)
  assert.equal(out.verification, 'reopened')
  assert.equal(w.get().verification, 'reopened')
})
