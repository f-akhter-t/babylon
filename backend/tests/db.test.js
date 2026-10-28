import test, { mock } from 'node:test'
import assert from 'node:assert/strict'

process.env.MONGODB_URI = 'mongodb://example.test/db'
process.env.JWT_SECRET = 'a-test-secret-long-enough'

const calls = []
let failNext = false
const fakeMongoose = {
  connection: { readyState: 0, name: 'babylon_test' },
  connect: async (uri, options) => {
    calls.push({ uri, options })
    await new Promise((resolve) => setTimeout(resolve, 5))
    if (failNext) throw new Error('unreachable')
    fakeMongoose.connection.readyState = 1
  },
}
mock.module('mongoose', { defaultExport: fakeMongoose })
const { connectDb } = await import('../src/config/db.js')
const { default: ensureDb } = await import('../src/middlewares/ensureDb.js')

const reset = () => {
  calls.length = 0
  failNext = false
  fakeMongoose.connection.readyState = 0
}

test('several requests at once start only one connection, with a small pool and a 5 second timeout', async () => {
  reset()
  await Promise.all([connectDb(), connectDb(), connectDb()])
  assert.equal(calls.length, 1)
  assert.equal(calls[0].options.maxPoolSize, 5)
  assert.equal(calls[0].options.serverSelectionTimeoutMS, 5000)
})

test('once connected, later calls do not connect again', async () => {
  await connectDb()
  assert.equal(calls.length, 1)
})

test('a failed attempt is forgotten, so the next request tries again', async () => {
  reset()
  failNext = true
  await assert.rejects(connectDb(), /unreachable/)
  failNext = false
  await connectDb()
  assert.equal(calls.length, 2)
})

test('ensureDb lets the request through when connected', async () => {
  reset()
  let passed
  await ensureDb({}, {}, (arg) => { passed = arg })
  assert.equal(passed, undefined)
})

test('ensureDb answers the standard 500 when the database cannot be reached', async () => {
  reset()
  failNext = true
  let passed
  await ensureDb({}, {}, (arg) => { passed = arg })
  assert.equal(passed.status, 500)
  assert.equal(passed.code, 'server-error')
  assert.ok(!/unreachable/.test(passed.message))
})
