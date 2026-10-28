// POST /api/citizen/reports/:id/reopen over HTTP: sign-in, role, id check and
// the answers. The service is replaced; its rules are in reopen.service.test.js.
import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import request from 'supertest'

process.env.JWT_SECRET = 'test-secret-not-real'
process.env.MONGODB_URI = 'mongodb://localhost/none'

const url = (path) => new URL(path, import.meta.url).href
const ID = '64b7f0f0f0f0f0f0f0f0f0f0'
const calls = []
let fail = null
mock.module(url('../src/citizen/service/reopen.service.js'), {
  namedExports: {
    reopenReport: async (user, id) => {
      calls.push([user.email, id])
      if (fail) {
        const { default: AppError } = await import('../src/utils/AppError.js')
        throw new AppError(fail.code, fail.status, 'x')
      }
      return { id, status: 'resolved', priority: 'reopened', verification: 'reopened' }
    },
  },
})

let app
let signToken
before(async () => {
  const { default: router } = await import('../src/citizen/routes/reopen.routes.js')
  const { default: authenticate } = await import('../src/middlewares/authenticate.js')
  const { default: authorize } = await import('../src/middlewares/authorize.js')
  const { default: errorHandler } = await import('../src/middlewares/errorHandler.js')
  ;({ signToken } = await import('../src/utils/token.js'))
  app = express()
  app.use(express.json())
  app.use('/api/citizen', authenticate, authorize('citizen'), router)
  app.use(errorHandler)
})

const citizen = () => signToken({ email: 'citizen@babylon.test', role: 'citizen' })
const reopen = (id = ID, token = citizen()) =>
  request(app).post(`/api/citizen/reports/${id}/reopen`).set('Authorization', `Bearer ${token}`)

test('a citizen reopens: 200, the email comes from the token', async () => {
  const res = await reopen()
  assert.equal(res.status, 200)
  assert.equal(res.body.data.verification, 'reopened')
  assert.deepEqual(calls.at(-1), ['citizen@babylon.test', ID])
})

test('no token gives 401; a department or admin token gives 403', async () => {
  assert.equal((await request(app).post(`/api/citizen/reports/${ID}/reopen`)).status, 401)
  const dept = signToken({ email: 'd@babylon.test', role: 'department', department: 'Roads & Highways' })
  const admin = signToken({ email: 'a@babylon.test', role: 'admin' })
  assert.equal((await reopen(ID, dept)).status, 403)
  assert.equal((await reopen(ID, admin)).status, 403)
})

test('the service answers 404 and 409 are passed on as they are', async () => {
  fail = { code: 'conflict', status: 409 }
  assert.equal((await reopen()).status, 409)
  fail = { code: 'not-found', status: 404 }
  assert.equal((await reopen()).status, 404)
  fail = null
})
