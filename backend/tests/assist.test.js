// F6 and F8 over HTTP: sign-in, role, validation, rate limit and the 503. The AI
// service is replaced; its own tests are in assist.service.test.js.
import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import request from 'supertest'

process.env.JWT_SECRET = 'test-secret-not-real'
process.env.MONGODB_URI = 'mongodb://localhost/none'

const url = (path) => new URL(path, import.meta.url).href
const calls = []
let mode = 'ok'
mock.module(url('../src/citizen/service/assist.service.js'), {
  namedExports: {
    assist: async (input) => {
      calls.push(['assist', input])
      if (mode === 'off') {
        const { default: AppError } = await import('../src/utils/AppError.js')
        throw new AppError('ai-unavailable', 503, 'off')
      }
      return { category: 'Roads', description: 'A deep pothole in the road.' }
    },
    summarize: async (text) => {
      calls.push(['summarize', text])
      if (mode === 'off') {
        const { default: AppError } = await import('../src/utils/AppError.js')
        throw new AppError('ai-unavailable', 503, 'off')
      }
      return { summary: 'Deep pothole.' }
    },
  },
})

const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ=='
let app
let signToken
// Any name is a citizen with that name. Each test uses its own names, so the rate
// limit (which counts bad requests too) never leaks from one test into the next.
const tokenOf = (who) =>
  who === 'dept'
    ? signToken({ email: 'd@babylon.test', role: 'department', department: 'Roads & Highways' })
    : who === 'admin'
      ? signToken({ email: 'a@babylon.test', role: 'admin' })
      : signToken({ email: `${who}@babylon.test`, role: 'citizen' })
before(async () => {
  const { default: router } = await import('../src/citizen/routes/assist.routes.js')
  const { default: authenticate } = await import('../src/middlewares/authenticate.js')
  const { default: authorize } = await import('../src/middlewares/authorize.js')
  const { default: errorHandler } = await import('../src/middlewares/errorHandler.js')
  ;({ signToken } = await import('../src/utils/token.js'))
  app = express()
  app.use(express.json({ limit: '8mb' }))
  // The same guard citizen/index.js puts in front of every citizen route.
  app.use('/api/citizen', authenticate, authorize('citizen'), router)
  app.use(errorHandler)
})

const assist = (body, who = 'one') =>
  request(app).post('/api/citizen/reports/assist').set('Authorization', `Bearer ${tokenOf(who)}`).send(body)
const summarize = (body, who = 'one') =>
  request(app).post('/api/citizen/reports/summarize').set('Authorization', `Bearer ${tokenOf(who)}`).send(body)

test('F6: a photo gives 200 with a category and a description', async () => {
  const res = await assist({ photoUrl: PHOTO, category: 'Roads' })
  assert.equal(res.status, 200)
  assert.equal(res.body.success, true)
  assert.deepEqual(res.body.data, { category: 'Roads', description: 'A deep pothole in the road.' })
  assert.deepEqual(calls.at(-1), ['assist', { photoUrl: PHOTO, category: 'Roads' }])
})

test('F8: some text gives 200 with a summary', async () => {
  const res = await summarize({ text: '  A big pothole on Station Road near the school.  ' })
  assert.equal(res.status, 200)
  assert.deepEqual(res.body.data, { summary: 'Deep pothole.' })
  assert.deepEqual(calls.at(-1), ['summarize', 'A big pothole on Station Road near the school.'])
})

test('no token gives 401; a department or admin token gives 403', async () => {
  assert.equal((await request(app).post('/api/citizen/reports/assist').send({ photoUrl: PHOTO })).status, 401)
  assert.equal((await request(app).post('/api/citizen/reports/summarize').send({ text: 'x'.repeat(20) })).status, 401)
  for (const who of ['dept', 'admin']) {
    const res = await assist({ photoUrl: PHOTO }, who)
    assert.equal(res.status, 403)
    assert.equal(res.body.code, 'forbidden')
  }
})

test('F6: a missing, wrong or too-big photo gives 400 on "photoUrl" and never reaches the AI', async () => {
  const before = calls.length
  for (const body of [
    {}, { photoUrl: '' }, { photoUrl: 5 }, { photoUrl: 'hello' },
    { photoUrl: 'data:text/html;base64,PGI+' }, { photoUrl: 'data:image/svg+xml;base64,PHN2Zz4=' },
  ]) {
    const res = await assist(body, 'photo-a')
    assert.equal(res.status, 400, JSON.stringify(body))
    assert.equal(res.body.field, 'photoUrl')
  }
  const huge = await assist({ photoUrl: `data:image/png;base64,${'A'.repeat(7_000_001)}` }, 'photo-b')
  assert.equal(huge.status, 400)
  assert.equal(huge.body.field, 'photoUrl')
  assert.equal(calls.length, before)
})

test('F6: an unknown category gives 400 on "category"', async () => {
  const res = await assist({ photoUrl: PHOTO, category: 'Other' }, 'category')
  assert.equal(res.status, 400)
  assert.equal(res.body.field, 'category')
})

test('F8: empty, too-short and too-long text give 400 on "text"', async () => {
  const before = calls.length
  for (const body of [{}, { text: '' }, { text: '    ' }, { text: 'short' }, { text: 7 }, { text: 'a'.repeat(2001) }]) {
    const res = await summarize(body, 'text-a')
    assert.equal(res.status, 400, JSON.stringify(body))
    assert.equal(res.body.field, 'text')
  }
  assert.equal((await summarize({ text: 'a'.repeat(2000) }, 'text-b')).status, 200)
  assert.equal(calls.length, before + 1)
})

test('Gemini off gives 503 ai-unavailable on both', async () => {
  mode = 'off'
  const a = await assist({ photoUrl: PHOTO }, 'off-a')
  const s = await summarize({ text: 'x'.repeat(20) }, 'off-b')
  mode = 'ok'
  for (const res of [a, s]) {
    assert.equal(res.status, 503)
    assert.equal(res.body.code, 'ai-unavailable')
  }
})

test('rapid repeats give 429 too-many-requests, per citizen, separately for F6 and F8', async () => {
  let last
  for (let i = 0; i < 8; i++) last = await assist({ photoUrl: PHOTO }, 'rapid')
  assert.equal(last.status, 429)
  assert.equal(last.body.code, 'too-many-requests')
  assert.equal((await assist({ photoUrl: PHOTO }, 'rapid-other')).status, 200, 'another citizen is not affected')
  assert.equal((await summarize({ text: 'x'.repeat(20) }, 'rapid')).status, 200, 'F8 has its own count')
  for (let i = 0; i < 11; i++) last = await summarize({ text: 'x'.repeat(20) }, 'rapid')
  assert.equal(last.status, 429)
})
