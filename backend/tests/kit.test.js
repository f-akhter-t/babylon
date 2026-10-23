import { test } from 'node:test'
import assert from 'node:assert/strict'

// Set before importing anything that reads config/env.js.
process.env.MONGODB_URI = 'mongodb://localhost/unused'
process.env.JWT_SECRET = 'test-secret-test-secret'

const { default: express } = await import('express')
const { default: request } = await import('supertest')
const { default: authenticate } = await import('../src/middlewares/authenticate.js')
const { default: authorize } = await import('../src/middlewares/authorize.js')
const { default: errorHandler } = await import('../src/middlewares/errorHandler.js')
const { default: AppError } = await import('../src/utils/AppError.js')
const { signToken } = await import('../src/utils/token.js')
const { success } = await import('../src/utils/response.js')

const app = express()
app.get('/dept', authenticate, authorize('department'), (req, res) => {
  success(res, 'Welcome.', { email: req.user.email })
})
app.get('/forbidden', () => {
  throw new AppError('forbidden', 403, 'Not allowed.')
})
app.get('/crash', () => {
  throw new Error('secret detail')
})
app.get('/bad-id', () => {
  const err = new Error('bad id')
  err.name = 'CastError'
  throw err
})
app.use(() => {
  throw new AppError('not-found', 404, 'Not found.')
})
app.use(errorHandler)

const bearer = (user) => ({ Authorization: `Bearer ${signToken(user)}` })
const roads = { email: 'roads@babylon.test', role: 'department', department: 'Roads' }

test('no token gives 401', async () => {
  const res = await request(app).get('/dept')
  assert.equal(res.status, 401)
  assert.equal(res.body.success, false)
  assert.equal(res.body.code, 'unauthorized')
})

test('a broken token gives 401', async () => {
  const res = await request(app).get('/dept').set('Authorization', 'Bearer nonsense')
  assert.equal(res.status, 401)
})

test('a citizen token on a department route gives 403', async () => {
  const res = await request(app).get('/dept').set(bearer({ email: 'c@babylon.test', role: 'citizen' }))
  assert.equal(res.status, 403)
  assert.equal(res.body.code, 'forbidden')
})

test('a department token that is not onboarded gives 403', async () => {
  const res = await request(app).get('/dept').set(bearer({ ...roads, onboarded: false }))
  assert.equal(res.status, 403)
})

test('a department token passes and uses the standard shape', async () => {
  const res = await request(app).get('/dept').set(bearer(roads))
  assert.equal(res.status, 200)
  assert.deepEqual(res.body, { success: true, message: 'Welcome.', data: { email: 'roads@babylon.test' } })
})

test('a thrown AppError becomes the standard failure shape', async () => {
  const res = await request(app).get('/forbidden')
  assert.equal(res.status, 403)
  assert.deepEqual(res.body, { success: false, code: 'forbidden', message: 'Not allowed.' })
})

test('an unexpected error gives 500 with no stack trace', async () => {
  const res = await request(app).get('/crash')
  assert.equal(res.status, 500)
  assert.equal(res.body.code, 'server-error')
  assert.equal(JSON.stringify(res.body).includes('secret detail'), false)
  assert.equal('stack' in res.body, false)
})

test('a bad database id gives 404, not 500', async () => {
  const res = await request(app).get('/bad-id')
  assert.equal(res.status, 404)
})

test('an unknown path gives the standard 404', async () => {
  const res = await request(app).get('/nowhere')
  assert.equal(res.status, 404)
  assert.equal(res.body.code, 'not-found')
})