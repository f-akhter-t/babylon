import { beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fail, installBrowser, installFetch, ok } from './helpers.js'

const store = installBrowser()
const net = installFetch()
const api = await import('../src/services/departmentApi.js')

beforeEach(() => {
  store.clear()
  net.reset()
})

describe('department panel', () => {
  it('loadDepartmentPanel reads the assigned and completed lists', async () => {
    net.reply(200, ok([{ id: 'a' }]))
    net.reply(200, ok([{ id: 'c' }]))
    const result = await api.loadDepartmentPanel()
    assert.deepEqual(result, { assigned: [{ id: 'a' }], completed: [{ id: 'c' }] })
    assert.deepEqual(net.calls.map((c) => c.url).sort(), [
      '/api/department/issues?scope=assigned',
      '/api/department/issues?scope=completed',
    ])
  })

  it('startWork is a PATCH to the status with in-progress', async () => {
    net.reply(200, ok({ id: 'x', status: 'in-progress' }))
    const issue = await api.startWork('x')
    assert.equal(issue.status, 'in-progress')
    assert.equal(net.calls[0].method, 'PATCH')
    assert.equal(net.calls[0].url, '/api/department/issues/x/status')
    assert.deepEqual(net.calls[0].body, { status: 'in-progress' })
  })

  it('submitForVerification posts the note and the photo', async () => {
    net.reply(200, ok({ id: 'x', verification: 'awaiting' }))
    await api.submitForVerification('x', { note: 'Patched', photoUrl: 'data:image/jpeg;base64,AAA' })
    assert.equal(net.calls[0].method, 'POST')
    assert.equal(net.calls[0].url, '/api/department/issues/x/submit')
    assert.deepEqual(net.calls[0].body, { note: 'Patched', photoUrl: 'data:image/jpeg;base64,AAA' })
  })

  it('a refusal keeps the server message and code', async () => {
    net.reply(409, fail('conflict', 'Work on this issue has already started.'))
    await assert.rejects(api.startWork('x'), {
      message: 'Work on this issue has already started.',
      code: 'conflict',
    })
  })
})
