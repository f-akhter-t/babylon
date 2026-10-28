// The public panel over HTTP: GET /api/issues, /api/issues/:id and the four
// /api/home endpoints. The shared services and the database are replaced by
// fakes, so this tests the routes, the checks on the query, the token handling
// and the Home queries. The real database is covered by Postman (see
// backend/postman/auth-public.json) and `npm run seed:public`.
import { test, mock, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'

process.env.MONGODB_URI = 'mongodb://localhost/unused'
process.env.JWT_SECRET = 'test-secret-test-secret'

const url = (path) => new URL(path, import.meta.url).href
const { toIssueJSON } = await import('../src/utils/issueView.js')
const { default: AppError } = await import('../src/utils/AppError.js')

// ---------- fakes ----------

const calls = { list: [], detail: [], query: [] }
let queryRows = []
let detailError = null

mock.module(url('../src/shared/service/issues.service.js'), {
  namedExports: {
    PUBLIC_FIELDS: '-pendingAfterImg -departmentNote',
    toIssueJSON,
    voteCounts: async (ids) => new Map(ids.map((id, i) => [String(id), (i + 1) * 10])),
    listIssues: async (args) => { calls.list.push(args); return [{ id: 'a', rank: 1 }] },
    getIssueDetail: async (id, args) => {
      calls.detail.push({ id, ...args })
      if (detailError) throw detailError
      return { id, title: 'One issue' }
    },
  },
})
mock.module(url('../src/shared/service/stats.service.js'), {
  namedExports: { getHomeStats: async () => ({ received: 228, resolved: 176, avgDays: 4.3, reopenedPercent: 4.5 }) },
})
mock.module(url('../src/models/issue.model.js'), {
  defaultExport: {
    find: (filter) => {
      const query = { filter, sort: null, limit: null, fields: null }
      calls.query.push(query)
      const chain = {
        sort(value) { query.sort = value; return chain },
        limit(value) { query.limit = value; return chain },
        select(value) { query.fields = value; return chain },
        lean() { return chain },
        then: (resolve, reject) => Promise.resolve(queryRows).then(resolve, reject),
      }
      return chain
    },
  },
})

let app
let request
let signToken
before(async () => {
  const { default: express } = await import('express')
  ;({ default: request } = await import('supertest'))
  const { default: publicRouter } = await import('../src/public/index.js')
  const { default: errorHandler } = await import('../src/middlewares/errorHandler.js')
  ;({ signToken } = await import('../src/utils/token.js'))
  app = express()
  app.use(express.json())
  app.use('/api', publicRouter)
  app.use(() => { throw new AppError('not-found', 404, 'Not found.') })
  app.use(errorHandler)
})

beforeEach(() => {
  calls.list.length = 0
  calls.detail.length = 0
  calls.query.length = 0
  queryRows = []
  detailError = null
})

const bearer = (email) => ({ Authorization: `Bearer ${signToken({ email, role: 'citizen' })}` })
const invalid = (res, field) => {
  assert.equal(res.status, 400)
  assert.equal(res.body.success, false)
  assert.equal(res.body.code, 'invalid')
  assert.equal(res.body.field, field)
}

// ---------- GET /api/issues ----------

test('GET /issues: a guest gets the list in the standard shape', async () => {
  const res = await request(app).get('/api/issues')
  assert.equal(res.status, 200)
  assert.deepEqual(res.body, { success: true, message: 'Issues loaded.', data: [{ id: 'a', rank: 1 }] })
  assert.equal(calls.list[0].viewerEmail, undefined)
  assert.equal(calls.list[0].from, undefined)
})

test('GET /issues: category, status and search reach the service, and combine', async () => {
  await request(app).get('/api/issues?category=Roads&status=open&search=%20pothole%20')
  assert.equal(calls.list[0].category, 'Roads')
  assert.equal(calls.list[0].status, 'open')
  assert.equal(calls.list[0].search, 'pothole')
})

test('GET /issues: All and blank values mean no filter', async () => {
  await request(app).get('/api/issues?category=All&status=&search=')
  assert.equal(calls.list[0].category, 'All')
  assert.equal(calls.list[0].status, undefined)
  assert.equal(calls.list[0].search, undefined)
})

test('GET /issues: lat and lng become the viewer position', async () => {
  await request(app).get('/api/issues?lat=22.354&lng=91.824')
  assert.deepEqual(calls.list[0].from, [22.354, 91.824])
})

test('GET /issues: the viewer comes from the token, never from the query', async () => {
  await request(app).get('/api/issues?viewerEmail=evil@babylon.test&email=evil@babylon.test').set(bearer('ann@babylon.test'))
  assert.equal(calls.list[0].viewerEmail, 'ann@babylon.test')
  await request(app).get('/api/issues?viewerEmail=evil@babylon.test')
  assert.equal(calls.list[1].viewerEmail, undefined)
})

test('GET /issues: a broken token is just a guest, not an error', async () => {
  const res = await request(app).get('/api/issues').set('Authorization', 'Bearer nonsense')
  assert.equal(res.status, 200)
  assert.equal(calls.list[0].viewerEmail, undefined)
})

test('GET /issues: a wrong category or status gives 400 with the field', async () => {
  invalid(await request(app).get('/api/issues?category=Potholes'), 'category')
  invalid(await request(app).get('/api/issues?status=done'), 'status')
  invalid(await request(app).get('/api/issues?category=Roads&category=Waste'), 'category')
  assert.equal(calls.list.length, 0)
})

test('GET /issues: a Mongo operator in the query never reaches the service', async () => {
  // Express reads "category[$ne]" as one odd key name, so category is simply not sent.
  const res = await request(app).get('/api/issues?category[$ne]=Roads&status[$ne]=open')
  assert.equal(res.status, 200)
  assert.equal(calls.list[0].category, undefined)
  assert.equal(calls.list[0].status, undefined)
  assert.equal(JSON.stringify(calls.list[0]).includes('$ne'), false)
})

test('GET /issues: a bad or lonely position gives 400', async () => {
  invalid(await request(app).get('/api/issues?lat=22.3'), 'lng')
  invalid(await request(app).get('/api/issues?lng=91.8'), 'lat')
  invalid(await request(app).get('/api/issues?lat=abc&lng=91'), 'lat')
  invalid(await request(app).get('/api/issues?lat=95&lng=91'), 'lat')
  invalid(await request(app).get('/api/issues?lat=22&lng=181'), 'lng')
  assert.equal(calls.list.length, 0)
})

test('GET /issues: a search over 100 characters gives 400', async () => {
  invalid(await request(app).get(`/api/issues?search=${'x'.repeat(101)}`), 'search')
})

// ---------- GET /api/issues/:id ----------

test('GET /issues/:id: returns the issue, with the token owner and position', async () => {
  const res = await request(app).get('/api/issues/abc123?lat=22.35&lng=91.82').set(bearer('ann@babylon.test'))
  assert.equal(res.status, 200)
  assert.deepEqual(res.body, { success: true, message: 'Issue loaded.', data: { id: 'abc123', title: 'One issue' } })
  assert.deepEqual(calls.detail[0], { id: 'abc123', from: [22.35, 91.82], viewerEmail: 'ann@babylon.test' })
})

test('GET /issues/:id: works for a guest', async () => {
  const res = await request(app).get('/api/issues/abc123')
  assert.equal(res.status, 200)
  assert.equal(calls.detail[0].viewerEmail, undefined)
})

test('GET /issues/:id: an unknown id gives the standard 404', async () => {
  detailError = new AppError('not-found', 404, 'We could not find that.')
  const res = await request(app).get('/api/issues/nope')
  assert.equal(res.status, 404)
  assert.deepEqual(res.body, { success: false, code: 'not-found', message: 'We could not find that.' })
})

test('GET /issues/:id: a bad position gives 400', async () => {
  invalid(await request(app).get('/api/issues/abc123?lat=22'), 'lng')
})

// ---------- GET /api/home/hero ----------

test('GET /home/hero: static slides and categories, for a guest, with no database call', async () => {
  const res = await request(app).get('/api/home/hero')
  assert.equal(res.status, 200)
  assert.equal(res.body.success, true)
  assert.equal(res.body.data.slides.length, 3)
  assert.deepEqual(res.body.data.categories, ['Roads', 'Waste', 'Water', 'Lighting', 'Bridges'])
  assert.equal(calls.query.length, 0)
})

// ---------- GET /api/home/stats ----------

test('GET /home/stats: the four figures from the shared stats service', async () => {
  const res = await request(app).get('/api/home/stats')
  assert.equal(res.status, 200)
  assert.deepEqual(res.body.data, { received: 228, resolved: 176, avgDays: 4.3, reopenedPercent: 4.5 })
})

// ---------- GET /api/home/fixed-this-week ----------

test('GET /home/fixed-this-week: latest 3 resolved issues that have an after-photo', async () => {
  queryRows = [
    { _id: new mongoose.Types.ObjectId(), title: 'Pipe', category: 'Water', status: 'resolved', afterImg: '/a.jpg', reporterEmail: 'x@babylon.test', createdAt: new Date() },
    { _id: new mongoose.Types.ObjectId(), title: 'Lamp', category: 'Lighting', status: 'resolved', afterImg: '/b.jpg', createdAt: new Date() },
  ]
  const res = await request(app).get('/api/home/fixed-this-week')
  assert.equal(res.status, 200)
  assert.deepEqual(res.body.data.map((i) => i.title), ['Pipe', 'Lamp'])
  assert.deepEqual(res.body.data.map((i) => i.votes), [10, 20])
  assert.equal(JSON.stringify(res.body).includes('x@babylon.test'), false)

  const [query] = calls.query
  assert.equal(query.filter.status, 'resolved')
  assert.deepEqual(query.filter.afterImg, { $nin: [null, ''] })
  assert.deepEqual(query.sort, { resolvedAt: -1, _id: -1 })
  assert.equal(query.limit, 3)
  assert.equal(query.fields, '-pendingAfterImg -departmentNote')
})

// ---------- GET /api/home/activity ----------

test('GET /home/activity: newest first, 8 by default', async () => {
  const id = new mongoose.Types.ObjectId()
  queryRows = [{ _id: id, title: 'Pothole', status: 'open', createdAt: new Date(Date.now() - 3 * 3600000) }]
  const res = await request(app).get('/api/home/activity')
  assert.equal(res.status, 200)
  assert.equal(res.body.data[0].id, String(id))
  assert.equal(res.body.data[0].title, 'Pothole')
  assert.equal(res.body.data[0].time, '3 hours ago')
  assert.deepEqual(calls.query[0].sort, { createdAt: -1, _id: -1 })
  assert.equal(calls.query[0].limit, 8)
})

test('GET /home/activity: limit is respected', async () => {
  await request(app).get('/api/home/activity?limit=3')
  assert.equal(calls.query[0].limit, 3)
})

test('GET /home/activity: a bad limit gives 400', async () => {
  for (const bad of ['0', '-1', '51', 'abc', '2.5']) {
    invalid(await request(app).get(`/api/home/activity?limit=${bad}`), 'limit')
  }
  assert.equal(calls.query.length, 0)
})

// ---------- the time words ----------

test('timeAgo says it the way the Home ticker does', async () => {
  const { timeAgo } = await import('../src/public/service/home.service.js')
  const now = new Date('2026-10-23T12:00:00Z')
  const at = (ms) => new Date(now.getTime() - ms)
  assert.equal(timeAgo(at(20 * 1000), now), 'Just now')
  assert.equal(timeAgo(at(5 * 60000), now), '5 min ago')
  assert.equal(timeAgo(at(3600000), now), '1 hour ago')
  assert.equal(timeAgo(at(3 * 3600000), now), '3 hours ago')
  assert.equal(timeAgo(at(30 * 3600000), now), 'Yesterday')
  assert.equal(timeAgo(at(4 * 86400000), now), '4 days ago')
})

// ---------- nothing else is open ----------

test('only GET exists on the public routes', async () => {
  for (const [method, path] of [['post', '/api/issues'], ['delete', '/api/issues/abc'], ['patch', '/api/home/stats']]) {
    const res = await request(app)[method](path)
    assert.equal(res.status, 404, `${method} ${path}`)
  }
})
