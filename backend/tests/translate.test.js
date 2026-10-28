// F10 translate: the service (fake Gemini), the rate limiter, and the route.
import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import request from 'supertest'

process.env.JWT_SECRET = 'test-secret-not-real'
process.env.MONGODB_URI = 'mongodb://localhost/none'

const url = (path) => new URL(path, import.meta.url).href
const calls = []
let mode = 'ok'
mock.module(url('../src/admin/service/translate.service.js'), {
  namedExports: {
    translate: async (text, to) => {
      calls.push([text, to])
      if (mode === 'off') {
        const { default: AppError } = await import('../src/utils/AppError.js')
        throw new AppError('ai-unavailable', 503, 'off')
      }
      return { translation: `[${to}] ${text}`, to }
    },
  },
})

let app
let token
before(async () => {
  const { default: router } = await import('../src/admin/routes/translate.routes.js')
  const { default: errorHandler } = await import('../src/middlewares/errorHandler.js')
  const { signToken } = await import('../src/utils/token.js')
  app = express()
  app.use(express.json())
  app.use('/api/translate', router)
  app.use(errorHandler)
  token = {
    citizen: signToken({ email: 'a@babylon.test', role: 'citizen' }),
    admin: signToken({ email: 'b@babylon.test', role: 'admin' }),
    spare: signToken({ email: 'c@babylon.test', role: 'department', department: 'Roads & Highways' }),
  }
})

const post = (body, who = 'citizen') =>
  request(app).post('/api/translate').set('Authorization', `Bearer ${token[who]}`).send(body)

test('a valid request answers 200 with the translation, for any role', async () => {
  const res = await post({ text: 'Deep pothole', to: 'bn' })
  assert.equal(res.status, 200)
  assert.deepEqual(res.body.data, { translation: '[bn] Deep pothole', to: 'bn' })
  assert.equal((await post({ text: 'Hello', to: 'en' }, 'admin')).status, 200)
})

test('no token gives 401', async () => {
  assert.equal((await request(app).post('/api/translate').send({ text: 'x', to: 'en' })).status, 401)
})

test('empty, missing and over-long text give 400', async () => {
  const before = calls.length
  for (const body of [{ text: '', to: 'en' }, { text: '   ', to: 'en' }, { to: 'en' }]) {
    const res = await post(body)
    assert.equal(res.status, 400)
    assert.equal(res.body.field, 'text')
  }
  const long = await post({ text: 'a'.repeat(1001), to: 'en' })
  assert.equal(long.status, 400)
  assert.equal(long.body.field, 'text')
  assert.equal((await post({ text: 'a'.repeat(1000), to: 'en' }, 'spare')).status, 200)
  assert.equal(calls.length, before + 1, 'bad requests never reach the AI')
})

test('an unsupported language gives 400', async () => {
  const res = await post({ text: 'Hello', to: 'fr' })
  assert.equal(res.status, 400)
  assert.equal(res.body.field, 'to')
})

test('Gemini off gives 503 ai-unavailable', async () => {
  mode = 'off'
  const res = await post({ text: 'Hello', to: 'en' }, 'admin')
  mode = 'ok'
  assert.equal(res.status, 503)
  assert.equal(res.body.code, 'ai-unavailable')
})

test('rapid repeats give 429 too-many-requests, per user', async () => {
  let last
  for (let i = 0; i < 12; i++) last = await post({ text: 'Hello', to: 'en' }, 'admin')
  assert.equal(last.status, 429)
  assert.equal(last.body.code, 'too-many-requests')
  assert.equal((await post({ text: 'Hello', to: 'en' }, 'citizen')).status, 200)
})
