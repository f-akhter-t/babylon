// F4 over HTTP: sign-in, role, validation, rate limit and the 503. The AI service
// is replaced; its own tests are in chat.service.test.js.
import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import request from 'supertest'

process.env.JWT_SECRET = 'test-secret-not-real'
process.env.MONGODB_URI = 'mongodb://localhost/none'

const url = (path) => new URL(path, import.meta.url).href
const calls = []
let mode = 'ok'
mock.module(url('../src/citizen/service/chat.service.js'), {
  namedExports: {
    chat: async (input) => {
      calls.push(input)
      if (mode === 'off') {
        const { default: AppError } = await import('../src/utils/AppError.js')
        throw new AppError('ai-unavailable', 503, 'off')
      }
      return { reply: 'Open Report and add a photo.' }
    },
  },
})

let app
let signToken
// Each test uses its own names, so the rate limit never leaks from one test into the next.
const tokenOf = (who) =>
  who === 'dept'
    ? signToken({ email: 'd@babylon.test', role: 'department', department: 'Roads & Highways' })
    : who === 'admin'
      ? signToken({ email: 'a@babylon.test', role: 'admin' })
      : signToken({ email: `${who}@babylon.test`, role: 'citizen' })
before(async () => {
  const { default: router } = await import('../src/citizen/routes/chat.routes.js')
  const { default: authenticate } = await import('../src/middlewares/authenticate.js')
  const { default: authorize } = await import('../src/middlewares/authorize.js')
  const { default: errorHandler } = await import('../src/middlewares/errorHandler.js')
  ;({ signToken } = await import('../src/utils/token.js'))
  app = express()
  app.use(express.json())
  app.use('/api/citizen', authenticate, authorize('citizen'), router)
  app.use(errorHandler)
})

const chat = (body, who = 'one') =>
  request(app).post('/api/citizen/chat').set('Authorization', `Bearer ${tokenOf(who)}`).send(body)

test('a question gives 200 with a reply, and only message and history reach the service', async () => {
  const history = [{ role: 'user', text: 'Hi' }, { role: 'assistant', text: 'Hello.' }]
  const res = await chat({ message: '  How do I report?  ', history, email: 'x@y.z' })
  assert.equal(res.status, 200)
  assert.deepEqual(res.body.data, { reply: 'Open Report and add a photo.' })
  assert.deepEqual(calls.at(-1), { message: 'How do I report?', history })
})

test('history is optional and defaults to empty', async () => {
  await chat({ message: 'What are levels?' }, 'nohistory')
  assert.deepEqual(calls.at(-1), { message: 'What are levels?', history: [] })
})

test('no token gives 401; a department or admin token gives 403', async () => {
  assert.equal((await request(app).post('/api/citizen/chat').send({ message: 'hi' })).status, 401)
  for (const who of ['dept', 'admin']) {
    const res = await chat({ message: 'hi' }, who)
    assert.equal(res.status, 403)
    assert.equal(res.body.code, 'forbidden')
  }
})

test('an empty, blank, missing or too-long message gives 400 on "message" and never reaches the AI', async () => {
  const before = calls.length
  for (const body of [{}, { message: '' }, { message: '   ' }, { message: 5 }, { message: 'a'.repeat(501) }]) {
    const res = await chat(body, 'bad-message')
    assert.equal(res.status, 400, JSON.stringify(body))
    assert.equal(res.body.field, 'message')
  }
  assert.equal(calls.length, before)
})

test('a bad history gives 400 on "history"', async () => {
  const long = Array.from({ length: 7 }, () => ({ role: 'user', text: 'x' }))
  for (const history of ['hello', [{ role: 'system', text: 'x' }], [{ role: 'user' }], [{ role: 'user', text: 'a'.repeat(501) }], long]) {
    const res = await chat({ message: 'hi', history }, 'bad-history')
    assert.equal(res.status, 400, JSON.stringify(history).slice(0, 60))
    assert.equal(res.body.field, 'history')
  }
})

test('Gemini off gives 503 ai-unavailable', async () => {
  mode = 'off'
  const res = await chat({ message: 'hi' }, 'off')
  mode = 'ok'
  assert.equal(res.status, 503)
  assert.equal(res.body.code, 'ai-unavailable')
})

test('rapid repeats give 429 too-many-requests, per citizen', async () => {
  let last
  for (let i = 0; i < 12; i++) last = await chat({ message: 'hi' }, 'rapid')
  assert.equal(last.status, 429)
  assert.equal(last.body.code, 'too-many-requests')
  assert.equal((await chat({ message: 'hi' }, 'rapid-other')).status, 200, 'another citizen is not affected')
})
