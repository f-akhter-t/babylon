// The citizen email check over HTTP: a code goes to the account's own address
// and the right code marks it verified. The user and email-code models are
// small in-memory fakes and the mailer is a spy; the email-code service, the
// rate limiter, the checks and the tokens are the real ones. The real database
// is covered by Postman (backend/postman/auth-public.json).
// Run: node --experimental-test-module-mocks --test tests/citizen.email.routes.test.js
import { test, mock, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'

process.env.MONGODB_URI = 'mongodb://localhost/unused'
process.env.JWT_SECRET = 'test-secret-test-secret'
process.env.EMAIL_MODE = 'dev'

const url = (path) => new URL(path, import.meta.url).href

// ---------- fake user model ----------

let rows = []
const holds = (row, filter) => Object.entries(filter).every(([key, want]) => String(row[key]) === String(want))
const chain = (read) => {
  const query = {
    select() { return query },
    sort() { return query },
    lean() { return query },
    then: (resolve, reject) => Promise.resolve(read()).then(resolve, reject),
  }
  return query
}
mock.module(url('../src/models/user.model.js'), {
  defaultExport: {
    findOne: (filter) => chain(() => {
      const row = rows.find((r) => holds(r, filter))
      return row ? { ...row } : null
    }),
    updateOne: async (filter, update) => {
      const row = rows.find((r) => holds(r, filter))
      if (row) Object.assign(row, update.$set)
    },
  },
})
// getProfile also looks for an identity record; none exists in these tests.
mock.module(url('../src/models/identity.model.js'), {
  defaultExport: { findOne: () => chain(() => null) },
})

// ---------- fake email-code model and mailer spy ----------

let emailRows = []
let nextEmailId = 1
const same = (row, filter) => Object.entries(filter).every(([k, v]) => String(row[k]) === String(v))
mock.module(url('../src/models/emailCode.model.js'), {
  defaultExport: {
    findOne: async (filter) => {
      const row = emailRows.find((r) => same(r, filter))
      return row ? { ...row } : null
    },
    findOneAndUpdate: async (filter, update, options = {}) => {
      let row = emailRows.find((r) => same(r, filter))
      if (!row) {
        if (!options.upsert) return null
        row = { _id: nextEmailId++, ...filter }
        emailRows.push(row)
      }
      const { $inc, ...set } = update
      Object.assign(row, set)
      for (const [key, step] of Object.entries($inc ?? {})) row[key] = (row[key] ?? 0) + step
      return { ...row }
    },
    deleteOne: async (filter) => { emailRows = emailRows.filter((r) => !same(r, filter)) },
  },
})

let mails = []
let mailFails = false
mock.module(url('../src/shared/service/mailer.service.js'), {
  namedExports: {
    sendMail: async (mail) => {
      if (mailFails) throw Object.assign(new Error('down'), { code: 'ECONNECTION' })
      mails.push(mail)
    },
  },
})

// ---------- app ----------

let request
let express
let errorHandler
let authenticate
let authorize
let AppError
let signToken
let freshRouter = 0

// A new router (and so new rate-limit counters) for every test.
async function buildApp() {
  const { default: router } = await import(`../src/citizen/routes/emailCheck.routes.js?fresh=${++freshRouter}`)
  const app = express()
  app.use(express.json())
  app.use('/api/citizen', authenticate, authorize('citizen'), router)
  app.use(() => { throw new AppError('not-found', 404, 'Not found.') })
  app.use(errorHandler)
  return app
}

before(async () => {
  ;({ default: express } = await import('express'))
  ;({ default: request } = await import('supertest'))
  ;({ default: errorHandler } = await import('../src/middlewares/errorHandler.js'))
  ;({ default: authenticate } = await import('../src/middlewares/authenticate.js'))
  ;({ default: authorize } = await import('../src/middlewares/authorize.js'))
  ;({ default: AppError } = await import('../src/utils/AppError.js'))
  ;({ signToken } = await import('../src/utils/token.js'))
})

let app
const citizen = (extra) => ({
  _id: new mongoose.Types.ObjectId(), name: 'Nadia Rahman', role: 'citizen', department: null,
  phone: '', phoneVerified: false, emailVerified: false, address: '', division: '', onboarded: true,
  ...extra,
})

beforeEach(async () => {
  emailRows = []
  nextEmailId = 1
  mails = []
  mailFails = false
  rows = [
    citizen({ email: 'nadia@babylon.test' }),
    citizen({ email: 'arif@babylon.test', name: 'Arif Hossain' }),
    { ...citizen({ email: 'roads@babylon.test', name: 'Roads Officer', role: 'department' }), department: 'Roads & Highways' },
  ]
  app = await buildApp()
})

const tokenFor = (email, role = 'citizen') => signToken({ email, role, department: null, onboarded: true })
const NADIA = () => tokenFor('nadia@babylon.test')
const bearer = (token) => ({ Authorization: `Bearer ${token}` })
const post = (path, body = {}, token = NADIA()) => {
  const call = request(app).post(`/api/citizen/profile${path}`)
  return (token ? call.set(bearer(token)) : call).send(body)
}
const row = (email) => rows.find((r) => r.email === email)

// ---------- email-code ----------

test('email-code: no token is 401 and a department token is 403', async () => {
  assert.equal((await post('/email-code', {}, null)).status, 401)
  assert.equal((await post('/email-code', {}, tokenFor('roads@babylon.test', 'department'))).status, 403)
  assert.equal(emailRows.length, 0)
})

test('email-code: 200, the code goes to the account\'s own email and is never in the answer', async () => {
  const { env } = await import('../src/config/env.js')
  env.emailMode = 'smtp'
  try {
    const res = await post('/email-code')
    assert.equal(res.status, 200)
    assert.deepEqual(res.body.data, { email: 'nadia@babylon.test', resendAfter: 30 })
    assert.equal(mails.length, 1)
    assert.equal(mails[0].to, 'nadia@babylon.test')
    assert.match(mails[0].subject, /verification/i)
    const sent = mails[0].text.match(/\b(\d{6})\b/)?.[1]
    assert.ok(sent, 'the mail carries a 6-digit code')
    assert.ok(!JSON.stringify(res.body).includes(sent), 'the code is not in the answer')
    assert.ok(!JSON.stringify(emailRows).includes(sent), 'only a hash is stored')
    assert.equal(emailRows[0].purpose, 'verify')
    const ok = await post('/email-verify', { code: sent })
    assert.equal(ok.status, 200)
    assert.equal(ok.body.data.emailVerified, true)
  } finally {
    env.emailMode = 'dev'
  }
})

test('email-code: it cannot be sent to another address, whatever the body says', async () => {
  const res = await post('/email-code', { email: 'victim@example.com' })
  assert.equal(res.status, 200)
  assert.equal(res.body.data.email, 'nadia@babylon.test')
  assert.equal(emailRows[0].email, 'nadia@babylon.test')
})

test('email-code: in dev mode nothing is mailed and the fixed code works', async () => {
  assert.equal((await post('/email-code')).status, 200)
  assert.equal(mails.length, 0)
  assert.equal((await post('/email-verify', { code: '123456' })).status, 200)
})

test('email-code: asking again at once is 429, with the seconds to wait', async () => {
  assert.equal((await post('/email-code')).status, 200)
  const again = await post('/email-code')
  assert.equal(again.status, 429)
  assert.equal(again.body.code, 'too-many-requests')
  assert.match(again.body.message, /wait \d+ seconds/)
})

test('email-code: an address that is already verified is 409 and nothing is sent', async () => {
  await post('/email-code')
  await post('/email-verify', { code: '123456' })
  const res = await post('/email-code')
  assert.equal(res.status, 409)
  assert.equal(res.body.code, 'conflict')
  assert.equal(mails.length, 0)
})

test('email-code: with email codes switched off it is a 500, never a fake success', async () => {
  const { env } = await import('../src/config/env.js')
  env.emailMode = 'off'
  try {
    assert.equal((await post('/email-code')).status, 500)
    assert.equal(emailRows.length, 0)
  } finally {
    env.emailMode = 'dev'
  }
})

test('email-code: a mail server that says no is 503, and no code is left behind', async () => {
  const { env } = await import('../src/config/env.js')
  env.emailMode = 'smtp'
  mailFails = true
  try {
    const res = await post('/email-code')
    assert.equal(res.status, 503)
    assert.equal(res.body.code, 'email-unavailable')
    assert.equal(emailRows.length, 0)
  } finally {
    env.emailMode = 'dev'
  }
})

test('email-code: a token for an account that does not exist is 404', async () => {
  const res = await post('/email-code', {}, tokenFor('stranger@babylon.test'))
  assert.equal(res.status, 404)
  assert.equal(emailRows.length, 0)
})

test('email-code: more than 10 requests a minute from one citizen is 429 too-many-requests', async () => {
  const { env } = await import('../src/config/env.js')
  env.emailMode = 'off' // every call fails fast, but still counts
  try {
    let last
    for (let i = 0; i < 11; i++) last = await post('/email-code')
    assert.equal(last.status, 429)
    assert.equal(last.body.code, 'too-many-requests')
  } finally {
    env.emailMode = 'dev'
  }
})

// ---------- email-verify ----------

test('email-verify: the right code marks the email verified, is used up, and answers with the profile', async () => {
  await post('/email-code')
  const res = await post('/email-verify', { code: ' 123456 ' })
  assert.equal(res.status, 200)
  assert.equal(res.body.data.emailVerified, true)
  assert.equal(res.body.data.email, 'nadia@babylon.test')
  assert.equal(row('nadia@babylon.test').emailVerified, true)
  assert.equal(emailRows.length, 0, 'a used code is gone')
})

test('email-verify: a wrong code is 400 on "code", the third wrong one locks it (423)', async () => {
  await post('/email-code')
  const body = { code: '000000' }
  for (let i = 0; i < 2; i++) {
    const wrong = await post('/email-verify', body)
    assert.equal(wrong.status, 400)
    assert.equal(wrong.body.code, 'invalid')
    assert.equal(wrong.body.field, 'code')
  }
  const locked = await post('/email-verify', body)
  assert.equal(locked.status, 423)
  assert.equal(locked.body.code, 'locked')
  assert.equal((await post('/email-verify', { code: '123456' })).status, 423, 'even the right code, until a new one is asked for')
  assert.equal(row('nadia@babylon.test').emailVerified, false)
})

test('email-verify: a code that is not 6 digits, or no code, is 400 on "code"', async () => {
  await post('/email-code')
  for (const body of [{}, { code: 'abc' }, { code: '12345' }, { code: '1234567' }, { code: 123456 }]) {
    const res = await post('/email-verify', body)
    assert.equal(res.status, 400, JSON.stringify(body))
    assert.equal(res.body.field, 'code', JSON.stringify(body))
  }
  assert.equal(row('nadia@babylon.test').emailVerified, false)
})

test('email-verify: no code asked for is 400 on "code"', async () => {
  const res = await post('/email-verify', { code: '123456' })
  assert.equal(res.status, 400)
  assert.equal(res.body.field, 'code')
  assert.equal(row('nadia@babylon.test').emailVerified, false)
})

test('email-verify: one citizen\'s code does not verify another account', async () => {
  await post('/email-code')
  const res = await post('/email-verify', { code: '123456' }, tokenFor('arif@babylon.test'))
  assert.equal(res.status, 400)
  assert.equal(row('arif@babylon.test').emailVerified, false)
  assert.equal(row('nadia@babylon.test').emailVerified, false)
})

test('email-verify: an address that is already verified just returns the profile', async () => {
  await post('/email-code')
  await post('/email-verify', { code: '123456' })
  const again = await post('/email-verify', { code: '000000' })
  assert.equal(again.status, 200)
  assert.equal(again.body.data.emailVerified, true)
})

test('email-verify: a department token is 403', async () => {
  assert.equal((await post('/email-verify', { code: '123456' }, tokenFor('roads@babylon.test', 'department'))).status, 403)
})

test('the email check changes only the email flag, nothing else on the account', async () => {
  const before = { ...row('nadia@babylon.test') }
  await post('/email-code')
  await post('/email-verify', { code: '123456' })
  assert.deepEqual({ ...row('nadia@babylon.test'), emailVerified: false }, before)
})
