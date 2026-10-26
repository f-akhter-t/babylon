// F2 over HTTP: sign-in, role, validation, rate limit. The service is replaced.
import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import request from 'supertest'
import { DUPLICATE_LIMITS } from '../src/constants/limits.js'

process.env.JWT_SECRET = 'test-secret-not-real'
process.env.MONGODB_URI = 'mongodb://localhost/none'

const url = (path) => new URL(path, import.meta.url).href
const calls = []
mock.module(url('../src/citizen/service/duplicates.service.js'), {
  namedExports: {
    check: async (input) => {
      calls.push(input)
      return { checked: true, matches: [{ id: 'x1', title: 'Pothole', similarity: 0.91 }] }
    },
  },
})

const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ=='
let app
let signToken
const tokenOf = (who) =>
  who === 'dept'
    ? signToken({ email: 'd@babylon.test', role: 'department', department: 'Roads & Highways' })
    : signToken({ email: `${who}@babylon.test`, role: 'citizen' })

before(async () => {
  const { default: router } = await import('../src/citizen/routes/duplicates.routes.js')
  const { default: authenticate } = await import('../src/middlewares/authenticate.js')
  const { default: authorize } = await import('../src/middlewares/authorize.js')
  const { default: errorHandler } = await import('../src/middlewares/errorHandler.js')
  ;({ signToken } = await import('../src/utils/token.js'))
  app = express()
  app.use(express.json({ limit: '8mb' }))
  app.use('/api/citizen', authenticate, authorize('citizen'), router)
  app.use(errorHandler)
})

const send = (body, who = 'one') =>
  request(app).post('/api/citizen/reports/duplicates').set('Authorization', `Bearer ${tokenOf(who)}`).send(body)

test('200: a valid photo returns matches, and the email comes from the token', async () => {
  const res = await send({ photoUrl: PHOTO }, 'ok1')
  assert.equal(res.status, 200)
  assert.equal(res.body.data.matches[0].id, 'x1')
  assert.equal(calls.at(-1).email, 'ok1@babylon.test')
  assert.equal(JSON.stringify(res.body).includes('imageEmbedding'), false)
})

test('401 without a token', async () => {
  const res = await request(app).post('/api/citizen/reports/duplicates').send({ photoUrl: PHOTO })
  assert.equal(res.status, 401)
})

test('403 for a staff token', async () => {
  const res = await send({ photoUrl: PHOTO }, 'dept')
  assert.equal(res.status, 403)
  assert.equal(res.body.code, 'forbidden')
})

test('400 when the photo is missing', async () => {
  const res = await send({}, 'bad1')
  assert.equal(res.status, 400)
  assert.equal(res.body.field, 'photoUrl')
})

test('400 when the photo is not an image data URL', async () => {
  const res = await send({ photoUrl: 'data:text/plain;base64,AAAA' }, 'bad2')
  assert.equal(res.status, 400)
  assert.equal(res.body.field, 'photoUrl')
})

test('429 after too many requests', async () => {
  let last
  for (let i = 0; i <= DUPLICATE_LIMITS.rate.max; i += 1) last = await send({ photoUrl: PHOTO }, 'rate1')
  assert.equal(last.status, 429)
  assert.equal(last.body.code, 'too-many-requests')
})