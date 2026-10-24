// The 4 admin alert endpoints: routing, access and the owner coming from the token.
// The shared alerts service is replaced by a recorder, because its own rules
// are tested in alerts.shared.test.js.
import { test, before, mock } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import request from 'supertest'

process.env.JWT_SECRET = 'test-secret-not-real'

const url = (path) => new URL(path, import.meta.url).href
const seen = []
mock.module(url('../src/shared/service/alerts.service.js'), {
  namedExports: {
    notify: async () => {},
    notifyMany: async () => {},
    listAlerts: async (email) => { seen.push(['list', email]); return { alerts: [{ id: 'a1' }], unreadCount: 1 } },
    getUnreadCount: async (email) => { seen.push(['count', email]); return { unreadCount: 1 } },
    markRead: async (email, id) => {
      seen.push(['read', email, id])
      if (id === '000000000000000000000000') {
        const { default: AppError } = await import('../src/utils/AppError.js')
        throw new AppError('not-found', 404, 'We could not find that notice.')
      }
      return { id, read: true }
    },
    markAllRead: async (email) => { seen.push(['all', email]); return { unreadCount: 0 } },
  },
})

let app
let token
before(async () => {
  const { default: adminRouter } = await import('../src/admin/index.js')
  const { default: errorHandler } = await import('../src/middlewares/errorHandler.js')
  const { signToken } = await import('../src/utils/token.js')
  app = express()
  app.use(express.json())
  app.use('/api/admin', adminRouter)
  app.use(errorHandler)
  token = {
    admin: signToken({ email: 'admin@babylon.test', role: 'admin' }),
    citizen: signToken({ email: 'citizen@babylon.test', role: 'citizen' }),
  }
})

const as = (who) => ({ Authorization: `Bearer ${token[who]}` })
const ID = '64b7f0a1c2d3e4f5a6b7c8d9'

test('no token gives 401 and a citizen token gives 403 on all four routes', async () => {
  const routes = [
    ['get', '/alerts'],
    ['get', '/alerts/unread-count'],
    ['post', '/alerts/read-all'],
    ['patch', `/alerts/${ID}/read`],
  ]
  for (const [method, path] of routes) {
    assert.equal((await request(app)[method](`/api/admin${path}`)).status, 401, `${method} ${path}`)
    const res = await request(app)[method](`/api/admin${path}`).set(as('citizen'))
    assert.equal(res.status, 403, `${method} ${path}`)
    assert.equal(res.body.code, 'forbidden')
  }
})

test('list and unread count answer 200 for the signed-in admin only', async () => {
  seen.length = 0
  const list = await request(app).get('/api/admin/alerts').set(as('admin'))
  assert.equal(list.status, 200)
  assert.equal(list.body.success, true)
  assert.deepEqual(list.body.data, { alerts: [{ id: 'a1' }], unreadCount: 1 })
  const count = await request(app).get('/api/admin/alerts/unread-count').set(as('admin'))
  assert.deepEqual(count.body.data, { unreadCount: 1 })
  assert.deepEqual(seen, [['list', 'admin@babylon.test'], ['count', 'admin@babylon.test']])
})

test('mark one read and mark all read use the email from the token', async () => {
  seen.length = 0
  const one = await request(app).patch(`/api/admin/alerts/${ID}/read`).set(as('admin'))
  assert.equal(one.status, 200)
  assert.deepEqual(one.body.data, { id: ID, read: true })
  const all = await request(app).post('/api/admin/alerts/read-all').set(as('admin'))
  assert.deepEqual(all.body.data, { unreadCount: 0 })
  assert.deepEqual(seen, [['read', 'admin@babylon.test', ID], ['all', 'admin@babylon.test']])
})

test('an alert that is not yours (or does not exist) is a 404 with the standard shape', async () => {
  const res = await request(app).patch('/api/admin/alerts/000000000000000000000000/read').set(as('admin'))
  assert.equal(res.status, 404)
  assert.deepEqual(Object.keys(res.body).sort(), ['code', 'message', 'success'])
  assert.equal(res.body.code, 'not-found')
})
