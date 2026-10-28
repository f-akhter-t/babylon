import { beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fail, installBrowser, installFetch, ok } from './helpers.js'

const store = installBrowser()
const net = installFetch()
const api = await import('../src/services/adminApi.js')
const http = await import('../src/services/http.js')

beforeEach(() => {
  store.clear()
  net.reset()
})

describe('verification', () => {
  it('loadVerification asks for the queue and the reopened list', async () => {
    net.reply(200, ok([{ id: 'a' }]))
    net.reply(200, ok([{ id: 'r' }]))
    const result = await api.loadVerification()
    assert.deepEqual(result, { queue: [{ id: 'a' }], reopened: [{ id: 'r' }] })
    assert.deepEqual(net.calls.map((c) => c.url).sort(), ['/api/admin/reopened', '/api/admin/verification-queue'])
  })

  it('getAdminCounts reads GET /admin/counts', async () => {
    net.reply(200, ok({ queue: 3, reopened: 1 }))
    assert.deepEqual(await api.getAdminCounts(), { queue: 3, reopened: 1 })
    assert.equal(net.calls[0].url, '/api/admin/counts')
  })

  it('approve, reject and send-to-queue are POSTs on the issue', async () => {
    net.reply(200, ok({ id: 'x' }))
    await api.approveResolution('x')
    await api.rejectResolution('x', 'Still there')
    await api.sendReopenedToQueue('x')
    assert.deepEqual(net.calls.map((c) => [c.method, c.url]), [
      ['POST', '/api/admin/issues/x/approve'],
      ['POST', '/api/admin/issues/x/reject'],
      ['POST', '/api/admin/issues/x/send-to-queue'],
    ])
    assert.deepEqual(net.calls[1].body, { reason: 'Still there' })
  })

  it('a refusal from the server keeps its message, code and field', async () => {
    net.reply(400, fail('invalid', 'Write a reason before sending this back.', 'reason'))
    await assert.rejects(api.rejectResolution('x', ''), {
      message: 'Write a reason before sending this back.',
      code: 'invalid',
      field: 'reason',
    })
  })
})

describe('accountability', () => {
  it('sends the period as ?weeks=', async () => {
    net.reply(200, ok({ weeks: 4 }))
    await api.loadAccountability(4)
    assert.equal(net.calls[0].url, '/api/admin/accountability?weeks=4')
  })
})

describe('identity review', () => {
  it('the queue is GET /admin/identity', async () => {
    net.reply(200, ok([{ id: 'i1' }]))
    assert.deepEqual(await api.getIdentityQueue(), [{ id: 'i1' }])
    assert.equal(net.calls[0].url, '/api/admin/identity')
  })

  it('the count is the number, not the object', async () => {
    net.reply(200, ok({ count: 4 }))
    assert.equal(await api.getIdentityQueueCount(), 4)
    assert.equal(net.calls[0].url, '/api/admin/identity/count')
  })

  it('review posts the decision and the reason', async () => {
    net.reply(200, ok({ id: 'i1', status: 'rejected', photoDeleted: true }))
    const result = await api.reviewIdentity({ id: 'i1' }, { decision: 'reject', reason: 'Blurry card photo.' })
    assert.equal(result.status, 'rejected')
    assert.equal(net.calls[0].url, '/api/admin/identity/i1/review')
    assert.deepEqual(net.calls[0].body, { decision: 'reject', reason: 'Blurry card photo.' })
  })
})

describe('identity photo', () => {
  let seen
  const answer = (status, body = null) => {
    seen = null
    globalThis.fetch = async (url, init) => {
      seen = { url, headers: init.headers }
      return { ok: status === 200, status, blob: async () => body, json: async () => body }
    }
  }
  const refusal = (code) => ({ success: false, code, message: 'The server said no.' })

  it('a 200 gives the picture, asked for with the saved token', async () => {
    http.setToken('admin-token')
    answer(200, 'BLOB')
    assert.deepEqual(await api.getIdentityPhoto({ id: 'i1' }), { kind: 'photo', blob: 'BLOB' })
    assert.equal(seen.url, '/api/admin/identity/i1/photo')
    assert.equal(seen.headers.Authorization, 'Bearer admin-token')
  })

  it('a 404 means missing', async () => {
    answer(404, refusal('not-found'))
    assert.deepEqual(await api.getIdentityPhoto({ id: 'i1' }), { kind: 'missing' })
  })

  it('any other failure, or no network, means error', async () => {
    answer(500, refusal('server-error'))
    assert.deepEqual(await api.getIdentityPhoto({ id: 'i1' }), { kind: 'error' })
    answer(403, refusal('forbidden'))
    assert.deepEqual(await api.getIdentityPhoto({ id: 'i1' }), { kind: 'error' })
    globalThis.fetch = async () => {
      throw new TypeError('Failed to fetch')
    }
    assert.deepEqual(await api.getIdentityPhoto({ id: 'i1' }), { kind: 'error' })
  })
})

describe('translate', () => {
  let net
  beforeEach(() => {
    net = installFetch() // the photo tests above replace fetch
  })

  it('translateText posts the text and the language to /translate', async () => {
    net.reply(200, ok({ translation: 'গভীর গর্ত', to: 'bn' }))
    const result = await api.translateText('Deep pothole', 'bn')
    assert.deepEqual(result, { translation: 'গভীর গর্ত', to: 'bn' })
    assert.equal(net.calls[0].url, '/api/translate')
    assert.equal(net.calls[0].method, 'POST')
    assert.deepEqual(net.calls[0].body, { text: 'Deep pothole', to: 'bn' })
  })

  it('shows the server sentence when the AI is off', async () => {
    net.reply(503, fail('ai-unavailable', 'Translation is not available right now. Please try again later.'))
    await assert.rejects(api.translateText('Hi', 'en'), (e) => e.code === 'ai-unavailable' && /not available/.test(e.message))
  })
})
