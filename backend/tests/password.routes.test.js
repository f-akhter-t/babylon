// Forgot password and reset password over HTTP. The user and email-code models are
// small in-memory fakes, the mailer is a spy, passwords use the real bcrypt, and
// the sign-in route is the real one (so a reset is proved by logging in).
// The real database is covered by Postman (backend/postman/auth-public.json).
// Run: node --experimental-test-module-mocks --test tests/password.routes.test.js
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
const query = (read) => {
  let withHash = false
  const q = {
    select(fields) { withHash = String(fields).includes('+passwordHash'); return q },
    lean() { return q },
    then: (resolve, reject) =>
      Promise.resolve(read())
        .then((row) => {
          if (!row) return null
          const { passwordHash, ...rest } = row
          return withHash ? { ...rest, passwordHash } : { ...rest }
        })
        .then(resolve, reject),
  }
  return q
}
mock.module(url('../src/models/user.model.js'), {
  defaultExport: {
    findOne: (filter) => query(() => rows.find((row) => holds(row, filter))),
    updateOne: async (filter, update) => {
      const row = rows.find((r) => holds(r, filter))
      if (row) Object.assign(row, update.$set)
    },
  },
})

// ---------- fake email-code model ----------

let codes = []
let nextCodeId = 1
mock.module(url('../src/models/emailCode.model.js'), {
  defaultExport: {
    findOne: async (filter) => {
      const row = codes.find((r) => holds(r, filter))
      return row ? { ...row } : null
    },
    findOneAndUpdate: async (filter, update, options = {}) => {
      let row = codes.find((r) => holds(r, filter))
      if (!row) {
        if (!options.upsert) return null
        row = { _id: nextCodeId++, ...filter }
        codes.push(row)
      }
      const { $inc, ...set } = update
      Object.assign(row, set)
      for (const [key, step] of Object.entries($inc ?? {})) row[key] = (row[key] ?? 0) + step
      return { ...row }
    },
    deleteOne: async (filter) => { codes = codes.filter((r) => !holds(r, filter)) },
  },
})

// ---------- mailer spy ----------

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
let AppError
let env
let hashPassword
let freshRouter = 0

async function buildApp() {
  const { default: passwordRouter } = await import(`../src/auth/routes/password.routes.js?fresh=${++freshRouter}`)
  const { default: authRouter } = await import('../src/auth/routes/auth.routes.js')
  const app = express()
  app.use(express.json({ limit: '8mb' }))
  app.use('/api/auth', passwordRouter)
  app.use('/api/auth', authRouter)
  app.use(() => { throw new AppError('not-found', 404, 'Not found.') })
  app.use(errorHandler)
  return app
}

before(async () => {
  ;({ default: express } = await import('express'))
  ;({ default: request } = await import('supertest'))
  ;({ default: errorHandler } = await import('../src/middlewares/errorHandler.js'))
  ;({ default: AppError } = await import('../src/utils/AppError.js'))
  ;({ env } = await import('../src/config/env.js'))
  ;({ hashPassword } = await import('../src/utils/password.js'))
})

let app
const account = async (extra) => ({
  _id: new mongoose.Types.ObjectId(), name: 'Someone', department: null,
  passwordHash: await hashPassword('old-secret'), onboarded: true, ...extra,
})

beforeEach(async () => {
  codes = []
  nextCodeId = 1
  mails = []
  mailFails = false
  env.emailMode = 'dev'
  rows = [
    await account({ email: 'citizen@babylon.test', name: 'Demo Citizen', role: 'citizen' }),
    await account({ email: 'roads@babylon.test', name: 'Roads Officer', role: 'department', department: 'Roads & Highways' }),
  ]
  app = await buildApp()
})

const forgot = (body) => request(app).post('/api/auth/forgot-password').send(body)
const reset = (body) => request(app).post('/api/auth/reset-password').send(body)
const login = (email, password, door = 'citizen') => request(app).post('/api/auth/login').send({ email, password, door })
const wire = (email = 'citizen@babylon.test', code = '123456', newPassword = 'brand-new-1') => ({ email, code, newPassword })

// ---------- forgot password ----------

test('forgot: an account gets a code, and the answer carries only the wait', async () => {
  const res = await forgot({ email: 'citizen@babylon.test' })
  assert.equal(res.status, 200)
  assert.equal(res.body.success, true)
  assert.equal(res.body.message, 'If an account with that email exists, we have sent it a code.')
  assert.deepEqual(res.body.data, { resendAfter: 30 })
  assert.equal(codes.length, 1)
  assert.equal(codes[0].purpose, 'reset')
  assert.ok(!JSON.stringify(res.body).includes('123456'), 'the code is never sent back')
})

test('forgot: an unknown email gets exactly the same answer and no code is made', async () => {
  const known = await forgot({ email: 'citizen@babylon.test' })
  const unknown = await forgot({ email: 'nobody@babylon.test' })
  assert.equal(unknown.status, known.status)
  assert.deepEqual(unknown.body, known.body)
  assert.equal(codes.length, 1)
})

test('forgot: the email is trimmed and not case sensitive', async () => {
  assert.equal((await forgot({ email: '  Citizen@Babylon.TEST ' })).status, 200)
  assert.equal(codes.length, 1)
})

test('forgot: a staff account can ask too', async () => {
  assert.equal((await forgot({ email: 'roads@babylon.test' })).status, 200)
  assert.equal(codes.length, 1)
})

test('forgot: a missing or badly shaped email is 400 on "email"', async () => {
  for (const body of [{}, { email: '' }, { email: 'not-an-email' }, { email: 5 }, { email: 'a@b' }]) {
    const res = await forgot(body)
    assert.equal(res.status, 400, JSON.stringify(body))
    assert.equal(res.body.field, 'email')
  }
  assert.equal(codes.length, 0)
})

test('forgot: asking again at once is the same 200 and does not send a second email', async () => {
  env.emailMode = 'smtp'
  const first = await forgot({ email: 'citizen@babylon.test' })
  const again = await forgot({ email: 'citizen@babylon.test' })
  assert.equal(again.status, 200)
  assert.deepEqual(again.body, first.body)
  assert.equal(mails.length, 1)
})

test('forgot (smtp): the email goes to the account address with a 6-digit code; nothing goes for an unknown address', async () => {
  env.emailMode = 'smtp'
  await forgot({ email: 'nobody@babylon.test' })
  assert.equal(mails.length, 0)
  await forgot({ email: 'citizen@babylon.test' })
  assert.equal(mails.length, 1)
  assert.equal(mails[0].to, 'citizen@babylon.test')
  assert.match(mails[0].text, /\b\d{6}\b/)
})

test('forgot (smtp): a mail server that is down still gives the same 200, so nothing is revealed', async () => {
  env.emailMode = 'smtp'
  const quiet = console.error
  console.error = () => {}
  try {
    mailFails = true
    const known = await forgot({ email: 'citizen@babylon.test' })
    const unknown = await forgot({ email: 'nobody@babylon.test' })
    assert.equal(known.status, 200)
    assert.deepEqual(known.body, unknown.body)
    assert.equal(codes.length, 0)
  } finally {
    console.error = quiet
  }
})

test('forgot: with email codes switched off it is a 500 for every email, never a fake success', async () => {
  env.emailMode = 'off'
  for (const email of ['citizen@babylon.test', 'nobody@babylon.test']) {
    const res = await forgot({ email })
    assert.equal(res.status, 500)
    assert.equal(res.body.success, false)
  }
  assert.equal(codes.length, 0)
})

test('forgot: five tries a minute, then 429', async () => {
  for (let i = 0; i < 5; i++) assert.equal((await forgot({ email: 'nobody@babylon.test' })).status, 200)
  const res = await forgot({ email: 'nobody@babylon.test' })
  assert.equal(res.status, 429)
  assert.equal(res.body.code, 'too-many-requests')
})

// ---------- reset password ----------

test('reset: the right code changes the password; the old one stops working and the new one logs in', async () => {
  await forgot({ email: 'citizen@babylon.test' })
  const res = await reset(wire())
  assert.equal(res.status, 200)
  assert.equal(res.body.message, 'Your password is changed. Please log in with it.')
  assert.equal(res.body.data ?? null, null)
  assert.ok(!JSON.stringify(res.body).includes('token'), 'a reset does not sign anyone in')
  assert.equal((await login('citizen@babylon.test', 'old-secret')).status, 401)
  const fresh = await login('citizen@babylon.test', 'brand-new-1')
  assert.equal(fresh.status, 200)
  assert.equal(fresh.body.data.user.role, 'citizen')
})

test('reset: a code works once', async () => {
  await forgot({ email: 'citizen@babylon.test' })
  assert.equal((await reset(wire())).status, 200)
  const again = await reset(wire('citizen@babylon.test', '123456', 'another-pass-2'))
  assert.equal(again.status, 400)
  assert.equal(again.body.field, 'code')
  assert.equal((await login('citizen@babylon.test', 'brand-new-1')).status, 200)
})

test('reset: a staff account can reset and then use the staff door', async () => {
  await forgot({ email: 'roads@babylon.test' })
  assert.equal((await reset(wire('roads@babylon.test'))).status, 200)
  assert.equal((await login('roads@babylon.test', 'brand-new-1', 'staff')).status, 200)
})

test('reset: the email is trimmed and not case sensitive', async () => {
  await forgot({ email: 'citizen@babylon.test' })
  assert.equal((await reset(wire('  CITIZEN@babylon.test '))).status, 200)
})

test('reset: a wrong code is 400 on "code", and the password is unchanged', async () => {
  await forgot({ email: 'citizen@babylon.test' })
  const res = await reset(wire('citizen@babylon.test', '000000'))
  assert.equal(res.status, 400)
  assert.equal(res.body.code, 'invalid')
  assert.equal(res.body.field, 'code')
  assert.equal((await login('citizen@babylon.test', 'old-secret')).status, 200)
})

test('reset: an unknown email, a wrong code and no code asked for all give the same answer', async () => {
  const unknown = await reset(wire('nobody@babylon.test'))
  const none = await reset(wire('citizen@babylon.test'))
  await forgot({ email: 'citizen@babylon.test' })
  const wrongCode = await reset(wire('citizen@babylon.test', '999999'))
  for (const res of [unknown, none, wrongCode]) {
    assert.equal(res.status, 400)
    assert.equal(res.body.field, 'code')
  }
  assert.equal(unknown.body.message, none.body.message)
  assert.equal(none.body.message, wrongCode.body.message)
})

test('reset: three wrong tries lock it (423), even for the right code; a new code clears it', async () => {
  await forgot({ email: 'citizen@babylon.test' })
  assert.equal((await reset(wire('citizen@babylon.test', '111111'))).status, 400)
  assert.equal((await reset(wire('citizen@babylon.test', '222222'))).status, 400)
  const third = await reset(wire('citizen@babylon.test', '333333'))
  assert.equal(third.status, 423)
  assert.equal(third.body.code, 'locked')
  assert.equal((await reset(wire())).status, 423)
  assert.equal((await login('citizen@babylon.test', 'old-secret')).status, 200)

  // The wait for a new code is over: a new code starts again from zero tries.
  codes[0].lastSentAt = new Date(Date.now() - 31_000)
  await forgot({ email: 'citizen@babylon.test' })
  assert.equal((await reset(wire())).status, 200)
})

test('reset: an expired code is 400', async () => {
  await forgot({ email: 'citizen@babylon.test' })
  codes[0].expiresAt = new Date(Date.now() - 1000)
  const res = await reset(wire())
  assert.equal(res.status, 400)
  assert.equal(res.body.field, 'code')
})

test('reset: a bad new password is 400 on "new" and the code is not used up', async () => {
  await forgot({ email: 'citizen@babylon.test' })
  for (const newPassword of [undefined, '', 'short', 'x'.repeat(73), 12345]) {
    const res = await reset({ email: 'citizen@babylon.test', code: '123456', newPassword })
    assert.equal(res.status, 400, String(newPassword))
    assert.equal(res.body.field, 'new')
  }
  assert.equal(codes.length, 1)
  assert.equal((await reset(wire())).status, 200)
})

test('reset: a missing code or email is 400 on that field', async () => {
  for (const [body, field] of [
    [{ email: 'citizen@babylon.test', newPassword: 'brand-new-1' }, 'code'],
    [{ email: 'citizen@babylon.test', code: '  ', newPassword: 'brand-new-1' }, 'code'],
    [{ code: '123456', newPassword: 'brand-new-1' }, 'email'],
    [{ email: 'nope', code: '123456', newPassword: 'brand-new-1' }, 'email'],
  ]) {
    const res = await reset(body)
    assert.equal(res.status, 400, JSON.stringify(body))
    assert.equal(res.body.field, field)
  }
})

test('reset: with email codes switched off it is a 500 and the password stays', async () => {
  await forgot({ email: 'citizen@babylon.test' })
  env.emailMode = 'off'
  assert.equal((await reset(wire())).status, 500)
  assert.equal((await login('citizen@babylon.test', 'old-secret')).status, 200)
})

test('reset (smtp): the emailed code works and the dev code does not', async () => {
  env.emailMode = 'smtp'
  await forgot({ email: 'citizen@babylon.test' })
  const code = /\b(\d{6})\b/.exec(mails[0].text)[1]
  const guess = code === '123456' ? '654321' : '123456'
  assert.equal((await reset(wire('citizen@babylon.test', guess))).status, 400)
  assert.equal((await reset(wire('citizen@babylon.test', code))).status, 200)
})

test('reset: ten tries a minute, then 429', async () => {
  for (let i = 0; i < 10; i++) assert.equal((await reset(wire('nobody@babylon.test'))).status, 400)
  const res = await reset(wire('nobody@babylon.test'))
  assert.equal(res.status, 429)
  assert.equal(res.body.code, 'too-many-requests')
})

test('the password hash and the code hash never appear in any answer', async () => {
  const bodies = [
    await forgot({ email: 'citizen@babylon.test' }),
    await reset(wire('citizen@babylon.test', '000000')),
    await reset(wire()),
  ].map((res) => JSON.stringify(res.body))
  for (const text of bodies) {
    assert.ok(!/passwordHash|codeHash|\$2[aby]\$/.test(text))
  }
})
