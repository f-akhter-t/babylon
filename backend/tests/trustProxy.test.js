// The rate limits count visitors by address. Behind Vercel that address is the one
// in X-Forwarded-For, which Express reads only when 'trust proxy' is set. So the live
// app trusts one proxy, and nothing else does.
// Run: node --experimental-test-module-mocks --test tests/trustProxy.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

process.env.MONGODB_URI = 'mongodb://localhost/unused'
process.env.JWT_SECRET = 'test-secret-test-secret'
process.env.EMAIL_MODE = 'smtp'
process.env.EMAIL_USER = 'sender@example.com'
process.env.EMAIL_APP_PASSWORD = 'abcdabcdabcdabcd'

// The real app, loaded the way the live server loads it.
process.env.NODE_ENV = 'production'
const { default: app } = await import('../src/app.js')
const { default: express } = await import('express')
const { default: request } = await import('supertest')
const { default: rateLimit } = await import('../src/middlewares/rateLimit.js')
const { default: errorHandler } = await import('../src/middlewares/errorHandler.js')

// A small app with the real rate limiter (one request a minute) and the given proxy setting.
function probe(trustProxy) {
  const small = express()
  small.set('trust proxy', trustProxy)
  small.get('/hit', rateLimit({ windowMs: 60_000, max: 1, message: 'Slow down.' }), (req, res) => {
    res.json({ ok: true })
  })
  small.use(errorHandler)
  return small
}
const from = (small, address) => request(small).get('/hit').set('X-Forwarded-For', address)

test('the live app trusts exactly one proxy', () => {
  assert.equal(app.get('trust proxy'), 1)
})

test('production trusts one proxy; any other setting trusts none', async () => {
  const live = (await import('../src/config/env.js?production')).env
  process.env.NODE_ENV = 'development'
  const local = (await import('../src/config/env.js?development')).env
  delete process.env.NODE_ENV
  const unset = (await import('../src/config/env.js?unset')).env
  assert.equal(live.trustProxy, 1)
  assert.equal(local.trustProxy, false)
  assert.equal(unset.trustProxy, false)
})

test('with the live setting, visitors behind the proxy are counted one by one', async () => {
  const small = probe(app.get('trust proxy'))
  assert.equal((await from(small, '203.0.113.7')).status, 200)
  const again = await from(small, '203.0.113.7')
  assert.equal(again.status, 429)
  assert.equal(again.body.code, 'too-many-requests')
  assert.equal((await from(small, '203.0.113.8')).status, 200) // somebody else is not held back
})

test('without the setting every visitor looks like the proxy and shares one limit', async () => {
  const small = probe(false)
  assert.equal((await from(small, '203.0.113.7')).status, 200)
  assert.equal((await from(small, '203.0.113.8')).status, 429)
})
