// GET /api/department/summary/weekly over HTTP: the 200 and the rate limit.
// The service is replaced; its counts are in weekly.service.test.js.
// Sign-in and the department-only guard are done once in department/index.js
// (tested in department.routes.test.js), so here a header stands in for the
// signed-in person.
import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import request from 'supertest'

const url = (path) => new URL(path, import.meta.url).href
const calls = []
mock.module(url('../src/department/service/weekly.service.js'), {
  namedExports: {
    getWeekly: async (user) => {
      calls.push(user.email)
      return { department: user.department, days: 7, counts: { newReports: 1 }, summary: null }
    },
  },
})

let app
before(async () => {
  const { default: router } = await import('../src/department/routes/weekly.routes.js')
  const { default: errorHandler } = await import('../src/middlewares/errorHandler.js')
  app = express()
  app.use((req, res, next) => {
    req.user = { email: req.get('x-test-email'), role: 'department', department: 'Roads & Highways' }
    next()
  })
  app.use('/api/department', router)
  app.use(errorHandler)
})

const get = (email) => request(app).get('/api/department/summary/weekly').set('x-test-email', email)

test('a staff member gets 200 with counts, even when summary is null', async () => {
  const res = await get('roads@babylon.test')
  assert.equal(res.status, 200)
  assert.equal(res.body.data.department, 'Roads & Highways')
  assert.equal(res.body.data.counts.newReports, 1)
  assert.equal(res.body.data.summary, null)
  assert.equal(calls.at(-1), 'roads@babylon.test')
})

test('rapid repeats give 429 too-many-requests, per staff member', async () => {
  let last
  for (let i = 0; i < 8; i++) last = await get('rapid@babylon.test')
  assert.equal(last.status, 429)
  assert.equal(last.body.code, 'too-many-requests')
  assert.equal((await get('rapid-other@babylon.test')).status, 200)
})
