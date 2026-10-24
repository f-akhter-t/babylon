// Phone-code service tests, with the database replaced by an in-memory fake.
import { test, before, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

process.env.MONGODB_URI = 'mongodb://localhost/unused-never-connected'
process.env.JWT_SECRET = 'test-secret-not-real'
process.env.PHONE_CODE_MODE = 'dev'

const url = (path) => new URL(path, import.meta.url).href

// ---- a tiny stand-in for the PhoneCode model ----
let rows = []
let nextId = 1
const matches = (row, filter) =>
  Object.entries(filter).every(([key, value]) => String(row[key]) === String(value))
const find = (filter) => rows.find((row) => matches(row, filter))

const fake = {
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
  updateOne: async (filter, update) => {
    const row = find(filter)
    if (row) Object.assign(row, update)
  },
  deleteOne: async (filter) => {
    rows = rows.filter((row) => !matches(row, filter))
  },
}
mock.module(url('../src/models/phoneCode.model.js'), { defaultExport: fake })

let service
let env
let LIMITS

before(async () => {
  service = await import('../src/shared/service/phoneCode.service.js')
  ;({ env } = await import('../src/config/env.js'))
  ;({ PHONE_CODE_LIMITS: LIMITS } = await import('../src/constants/limits.js'))
})

beforeEach(() => {
  rows = []
  nextId = 1
})

const T0 = Date.UTC(2026, 9, 25, 9, 0, 0)
const sec = (n) => n * 1000
const min = (n) => n * 60 * 1000
const ME = { userId: 'user-1', phone: '01712345678' }
const GOOD = '123456'

const fails = (promise, code, status, field) =>
  assert.rejects(promise, (err) => {
    assert.equal(err.code, code)
    assert.equal(err.status, status)
    if (field) assert.equal(err.field, field)
    return true
  })

test('send: succeeds in dev mode and stores a hash, not the code', async () => {
  const res = await service.sendCode(ME, T0)
  assert.deepEqual(res, { sent: true, resendAfter: LIMITS.resendSeconds })
  assert.equal(rows.length, 1)
  assert.notEqual(rows[0].codeHash, GOOD)
  assert.equal(rows[0].codeHash.length, 64)
})

test('send: fails closed (500) when the mode is not dev', async () => {
  env.phoneCodeMode = 'off'
  try {
    await fails(service.sendCode(ME, T0), 'server-error', 500)
    assert.equal(rows.length, 0)
  } finally {
    env.phoneCodeMode = 'dev'
  }
})

test('send: a resend inside 30 seconds gives 429 with the seconds left', async () => {
  await service.sendCode(ME, T0)
  await assert.rejects(service.sendCode(ME, T0 + sec(10)), (err) => {
    assert.equal(err.code, 'too-many-requests')
    assert.equal(err.status, 429)
    assert.match(err.message, /20 seconds/)
    return true
  })
  await service.sendCode(ME, T0 + sec(31))
})

test('verify: the right code verifies once, then the code is gone', async () => {
  await service.sendCode(ME, T0)
  assert.deepEqual(await service.verifyCode({ ...ME, code: GOOD }, T0 + sec(5)), { verified: true })
  assert.equal(rows.length, 0)
  await fails(service.verifyCode({ ...ME, code: GOOD }, T0 + sec(6)), 'invalid', 400, 'code')
})

test('verify: a wrong code gives 400 on the code field and shows attempts left', async () => {
  await service.sendCode(ME, T0)
  await assert.rejects(service.verifyCode({ ...ME, code: '000000' }, T0 + sec(1)), (err) => {
    assert.equal(err.code, 'invalid')
    assert.equal(err.status, 400)
    assert.equal(err.field, 'code')
    assert.match(err.message, /2/)
    return true
  })
})

test('verify: the third wrong code gives 423 and kills the code, even the right one', async () => {
  await service.sendCode(ME, T0)
  await fails(service.verifyCode({ ...ME, code: '1' }, T0 + sec(1)), 'invalid', 400)
  await fails(service.verifyCode({ ...ME, code: '2' }, T0 + sec(2)), 'invalid', 400)
  await fails(service.verifyCode({ ...ME, code: '3' }, T0 + sec(3)), 'locked', 423)
  await fails(service.verifyCode({ ...ME, code: GOOD }, T0 + sec(4)), 'locked', 423)
})

test('after a lock, a new code comes only after 30 seconds, and then works', async () => {
  await service.sendCode(ME, T0)
  for (let i = 1; i <= 3; i++) {
    await service.verifyCode({ ...ME, code: 'x' }, T0 + sec(i)).catch(() => {})
  }
  await fails(service.sendCode(ME, T0 + sec(10)), 'too-many-requests', 429, 'phone')
  await service.sendCode(ME, T0 + sec(31))
  assert.deepEqual(await service.verifyCode({ ...ME, code: GOOD }, T0 + sec(32)), { verified: true })
})

test('verify: a code older than 10 minutes is refused', async () => {
  await service.sendCode(ME, T0)
  await fails(
    service.verifyCode({ ...ME, code: GOOD }, T0 + min(LIMITS.lifeMinutes) + sec(1)),
    'invalid',
    400,
    'code',
  )
})

test('send: a new code resets the attempts', async () => {
  await service.sendCode(ME, T0)
  await service.verifyCode({ ...ME, code: 'x' }, T0 + sec(1)).catch(() => {})
  await service.verifyCode({ ...ME, code: 'x' }, T0 + sec(2)).catch(() => {})
  await service.sendCode(ME, T0 + sec(40))
  assert.equal(rows[0].attempts, 0)
  await fails(service.verifyCode({ ...ME, code: 'x' }, T0 + sec(41)), 'invalid', 400)
})

test('a code for one phone does not verify another phone', async () => {
  await service.sendCode(ME, T0)
  await fails(
    service.verifyCode({ userId: ME.userId, phone: '01800000000', code: GOOD }, T0 + sec(1)),
    'invalid',
    400,
    'code',
  )
})

test('two accounts keep separate codes and limits', async () => {
  await service.sendCode(ME, T0)
  await service.sendCode({ userId: 'user-2', phone: ME.phone }, T0 + sec(1))
  assert.equal(rows.length, 2)
})