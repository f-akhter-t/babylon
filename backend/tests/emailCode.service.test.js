// Email-code service tests: the EmailCode model is an in-memory fake and the
// mailer is a spy, so no database and no mail server is used.
import { test, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

process.env.MONGODB_URI = 'mongodb://localhost/unused-never-connected'
process.env.JWT_SECRET = 'test-secret-not-real'
process.env.EMAIL_MODE = 'dev'

const url = (path) => new URL(path, import.meta.url).href

// ---- a tiny stand-in for the EmailCode model ----
let rows = []
let nextId = 1
const matches = (row, filter) =>
  Object.entries(filter).every(([key, value]) => String(row[key]) === String(value))
const find = (filter) => rows.find((row) => matches(row, filter))

mock.module(url('../src/models/emailCode.model.js'), {
  defaultExport: {
    findOne: async (filter) => {
      const row = find(filter)
      return row ? { ...row } : null
    },
    findOneAndUpdate: async (filter, update, options = {}) => {
      let row = find(filter)
      if (!row) {
        if (!options.upsert) return null
        row = { _id: nextId++, ...filter }
        rows.push(row)
      }
      const { $inc, ...set } = update
      Object.assign(row, set)
      for (const [key, step] of Object.entries($inc ?? {})) row[key] = (row[key] ?? 0) + step
      return { ...row }
    },
    deleteOne: async (filter) => {
      rows = rows.filter((row) => !matches(row, filter))
    },
  },
})

// ---- a spy for the mailer ----
let sent = []
let mailFails = false
mock.module(url('../src/shared/service/mailer.service.js'), {
  namedExports: {
    sendMail: async (mail) => {
      if (mailFails) throw Object.assign(new Error('Invalid login'), { code: 'EAUTH', responseCode: 535 })
      sent.push(mail)
    },
  },
})

let service
let env
let LIMITS

before(async () => {
  service = await import('../src/shared/service/emailCode.service.js')
  ;({ env } = await import('../src/config/env.js'))
  ;({ EMAIL_CODE_LIMITS: LIMITS } = await import('../src/constants/limits.js'))
})

beforeEach(() => {
  rows = []
  sent = []
  nextId = 1
  mailFails = false
  env.emailMode = 'dev'
})

const T0 = Date.UTC(2026, 10, 25, 9, 0, 0)
const who = { userId: 'u1', email: 'farhana@example.com', purpose: 'reset' }
const attempt = (code, now = T0 + 1000) => service.verifyCode({ ...who, code }, now)
const codeOf = (mail) => /\b(\d{6})\b/.exec(mail.text)[1]

test('dev mode: stores a hash of the fixed code and sends nothing', async () => {
  const result = await service.sendCode(who, T0)
  assert.deepEqual(result, { sent: true, resendAfter: LIMITS.resendSeconds })
  assert.equal(rows.length, 1)
  assert.equal(sent.length, 0)
  assert.ok(!JSON.stringify(rows).includes(LIMITS.devCode), 'only a hash is stored')
  assert.equal(rows[0].expiresAt.getTime(), T0 + LIMITS.lifeMinutes * 60 * 1000)
})

test('dev mode: the fixed code verifies once, then it is used up', async () => {
  await service.sendCode(who, T0)
  assert.deepEqual(await attempt('123456'), { verified: true })
  assert.equal(rows.length, 0)
  await assert.rejects(attempt('123456'), (e) => e.status === 400 && e.field === 'code')
})

test('smtp mode: a random 6-digit code is emailed to the address, and only its hash is stored', async () => {
  env.emailMode = 'smtp'
  await service.sendCode(who, T0)
  assert.equal(sent.length, 1)
  assert.equal(sent[0].to, 'farhana@example.com')
  assert.equal(sent[0].subject, 'Your Babylon password reset code')
  const code = codeOf(sent[0])
  assert.match(code, /^\d{6}$/)
  assert.match(sent[0].text, /10 minutes/)
  assert.ok(!JSON.stringify(rows).includes(code), 'the code is not stored')
  assert.deepEqual(await attempt(code), { verified: true })
})

test('smtp mode: codes are not all the same (random, with leading zeros kept)', async () => {
  env.emailMode = 'smtp'
  const seen = new Set()
  for (let i = 0; i < 12; i++) {
    rows = []
    await service.sendCode(who, T0)
    seen.add(codeOf(sent.at(-1)))
  }
  assert.ok(seen.size > 1)
  for (const code of seen) assert.equal(code.length, 6)
})

test('smtp mode: if the mail server refuses, the stored code is removed and the error is 503', async () => {
  env.emailMode = 'smtp'
  mailFails = true
  const errors = []
  const original = console.error
  console.error = (...args) => errors.push(args.join(' '))
  try {
    await assert.rejects(service.sendCode(who, T0), (e) => e.status === 503 && e.code === 'email-unavailable')
  } finally {
    console.error = original
  }
  assert.equal(rows.length, 0)
  assert.match(errors.join(), /EAUTH/)
  assert.ok(!errors.join().includes('farhana@example.com'), 'the address is not logged')
  mailFails = false
  await service.sendCode(who, T0 + 1000)
  assert.equal(sent.length, 1, 'a failed send does not start the wait')
})

test('asking again within the wait is 429 with the seconds left; after the wait it is fine and clears the tries', async () => {
  await service.sendCode(who, T0)
  await assert.rejects(
    service.sendCode(who, T0 + 10_000),
    (e) => e.status === 429 && e.code === 'too-many-requests' && /20 seconds/.test(e.message),
  )
  for (let i = 0; i < 3; i++) await attempt('000000').catch(() => {})
  await assert.rejects(attempt('123456'), (e) => e.status === 423)
  await service.sendCode(who, T0 + LIMITS.resendSeconds * 1000)
  assert.deepEqual(await attempt('123456', T0 + 31_000), { verified: true })
})

test('a wrong code is 400 on "code"; the third wrong try locks (423), even for the right code', async () => {
  await service.sendCode(who, T0)
  await assert.rejects(attempt('111111'), (e) => e.status === 400 && e.field === 'code')
  await assert.rejects(attempt('222222'), (e) => e.status === 400)
  await assert.rejects(attempt('333333'), (e) => e.status === 423 && e.code === 'locked')
  await assert.rejects(attempt('123456'), (e) => e.status === 423)
})

test('wrong, expired and never-asked-for all give the same sentence', async () => {
  const messages = new Set()
  await assert.rejects(attempt('123456'), (e) => (messages.add(e.message), e.status === 400)) // never asked
  await service.sendCode(who, T0)
  await assert.rejects(attempt('999999'), (e) => (messages.add(e.message), e.status === 400)) // wrong
  await assert.rejects(attempt('123456', T0 + LIMITS.lifeMinutes * 60_000), (e) => (messages.add(e.message), e.status === 400)) // expired
  assert.equal(messages.size, 1)
})

test('a code is for one account, one purpose and one address', async () => {
  await service.sendCode(who, T0)
  await assert.rejects(service.verifyCode({ ...who, userId: 'u2', code: '123456' }, T0 + 1000), (e) => e.status === 400)
  await assert.rejects(service.verifyCode({ ...who, purpose: 'verify', code: '123456' }, T0 + 1000), (e) => e.status === 400)
  await assert.rejects(service.verifyCode({ ...who, email: 'other@example.com', code: '123456' }, T0 + 1000), (e) => e.status === 400)
})

test('switched off: sending and checking are 500, never a fake success', async () => {
  env.emailMode = 'off'
  await assert.rejects(service.sendCode(who, T0), (e) => e.status === 500)
  assert.throws(() => service.assertAvailable(), (e) => e.status === 500)
  assert.equal(rows.length, 0)
})
