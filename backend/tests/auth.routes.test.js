// The auth panel over HTTP: signup, login (with the door), logout, me and
// change password. The user model is a small in-memory fake, but the passwords
// are hashed and checked with the real bcrypt, and the tokens are the real ones.
// The real database is covered by Postman (backend/postman/auth-public.json).
// Run: node --experimental-test-module-mocks --test tests/auth.routes.test.js
import { test, mock, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

process.env.MONGODB_URI = 'mongodb://localhost/unused'
process.env.JWT_SECRET = 'test-secret-test-secret'

const url = (path) => new URL(path, import.meta.url).href

// ---------- fake user model ----------

let rows = []
let raceOnce = false // the next create() loses a race for the same email
const found = (email) => rows.find((row) => row.email === email) ?? null
const chain = (read) => {
  const query = {
    select(fields) { query.withHash = String(fields).includes('+passwordHash'); return query },
    lean() { return query },
    then: (resolve, reject) => Promise.resolve(read(query)).then(resolve, reject),
  }
  return query
}
// A row as the database returns it: the hash is hidden unless +passwordHash is asked for.
const shown = (row, withHash) => {
  if (!row) return null
  const { passwordHash, ...rest } = row
  return withHash ? { ...rest, passwordHash } : rest
}

const FakeUser = {
  exists: (filter) => chain(() => { const row = found(filter.email); return row ? { _id: row._id } : null }),
  findOne: (filter) => chain((query) => shown(found(filter.email), query.withHash)),
  create: async (doc) => {
    if (raceOnce || found(doc.email)) {
      raceOnce = false
      throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 })
    }
    const row = { _id: new mongoose.Types.ObjectId(), department: null, onboarded: true, ...doc }
    rows.push(row)
    return shown(row, false)
  },
  updateOne: async (filter, update) => {
    const row = rows.find((r) => String(r._id) === String(filter._id))
    Object.assign(row, update.$set)
  },
}
mock.module(url('../src/models/user.model.js'), { defaultExport: FakeUser })

// ---------- app ----------

let request
let app
let verifyToken
let AppError
before(async () => {
  const { default: express } = await import('express')
  ;({ default: request } = await import('supertest'))
  const { default: authRouter } = await import('../src/auth/index.js')
  const { default: errorHandler } = await import('../src/middlewares/errorHandler.js')
  ;({ verifyToken } = await import('../src/utils/token.js'))
  ;({ default: AppError } = await import('../src/utils/AppError.js'))
  app = express()
  app.use(express.json())
  app.use('/api/auth', authRouter)
  app.use(() => { throw new AppError('not-found', 404, 'Not found.') })
  app.use(errorHandler)
})

// Hashing with the real cost takes a moment, so hash once and reuse.
const COST = 10
const hashes = {}
before(async () => {
  hashes.password123 = await bcrypt.hash('password123', COST)
  hashes.other = await bcrypt.hash('another-pass', COST)
})

const account = (extra) => ({
  _id: new mongoose.Types.ObjectId(),
  name: 'Someone',
  department: null,
  onboarded: true,
  ...extra,
})

beforeEach(() => {
  raceOnce = false
  rows = [
    account({ email: 'citizen@babylon.test', name: 'Demo Citizen', role: 'citizen', passwordHash: hashes.password123 }),
    account({ email: 'roads@babylon.test', name: 'Roads Officer', role: 'department', department: 'Roads & Highways', passwordHash: hashes.password123 }),
    account({ email: 'admin@babylon.test', name: 'Admin', role: 'admin', passwordHash: hashes.password123 }),
    account({ email: 'newstaff@babylon.test', name: 'New Staff', role: 'department', department: 'Electricity', onboarded: false, passwordHash: hashes.password123 }),
    // How the seeds make staff who can only use test tokens.
    account({ email: 'seeded@babylon.test', name: 'Seeded', role: 'department', department: 'Electricity', passwordHash: '!seed-no-login' }),
  ]
})

const post = (path, body) => request(app).post(`/api/auth${path}`).send(body)
const login = (email, password, door = 'citizen') => post('/login', { email, password, door })
const bearer = (token) => ({ Authorization: `Bearer ${token}` })
const noLeak = (res) => {
  const text = JSON.stringify(res.body)
  assert.ok(!text.includes('passwordHash'), 'passwordHash must never be sent')
  assert.ok(!text.includes('$2b$'), 'a hash must never be sent')
}

// ---------- signup ----------

test('signup: 201, a citizen, a working token, no hash in the answer', async () => {
  const res = await post('/signup', { name: 'Farhana Akhter', email: 'farhana@example.com', password: 'secret1' })
  assert.equal(res.status, 201)
  assert.equal(res.body.success, true)
  assert.equal(res.body.data.user.email, 'farhana@example.com')
  assert.equal(res.body.data.user.name, 'Farhana Akhter')
  assert.equal(res.body.data.user.role, 'citizen')
  assert.equal(res.body.data.user.department, null)
  assert.deepEqual(verifyToken(res.body.data.token), {
    email: 'farhana@example.com', role: 'citizen', department: null, onboarded: true,
  })
  noLeak(res)
})

test('signup: the password is stored as a bcrypt hash, never as typed', async () => {
  await post('/signup', { name: 'Farhana Akhter', email: 'farhana@example.com', password: 'secret1' })
  const stored = rows.find((r) => r.email === 'farhana@example.com')
  assert.notEqual(stored.passwordHash, 'secret1')
  assert.match(stored.passwordHash, /^\$2[aby]\$10\$/)
  assert.ok(await bcrypt.compare('secret1', stored.passwordHash))
})

test('signup: the email is trimmed and lower-cased, the name trimmed', async () => {
  const res = await post('/signup', { name: '  Riktika T.  ', email: '  Riktika@Example.COM ', password: 'secret1' })
  assert.equal(res.status, 201)
  assert.equal(res.body.data.user.email, 'riktika@example.com')
  assert.equal(res.body.data.user.name, 'Riktika T.')
  assert.ok(rows.some((r) => r.email === 'riktika@example.com'))
})

test('signup: names in other scripts are fine', async () => {
  const res = await post('/signup', { name: 'ফারহানা আকতার', email: 'bn@example.com', password: 'secret1' })
  assert.equal(res.status, 201)
})

test('signup: a taken email gives 409, whatever its case', async () => {
  const res = await post('/signup', { name: 'Copy Cat', email: 'CITIZEN@babylon.test', password: 'secret1' })
  assert.equal(res.status, 409)
  assert.equal(res.body.code, 'conflict')
  assert.equal(res.body.field, 'email')
  assert.equal(rows.length, 5)
})

test('signup: two sign-ups at the same moment still give 409, not 500', async () => {
  raceOnce = true
  const res = await post('/signup', { name: 'Copy Cat', email: 'racer@example.com', password: 'secret1' })
  assert.equal(res.status, 409)
  assert.equal(res.body.code, 'conflict')
  assert.equal(res.body.field, 'email')
  assert.equal(res.body.message, 'An account with this email already exists.')
})

test('signup: always a citizen. A staff role, or extra fields, can not be smuggled in', async () => {
  for (const role of ['admin', 'department', 'Citizen', '']) {
    const res = await post('/signup', { name: 'Sneaky', email: `s-${role || 'blank'}@example.com`, password: 'secret1', role })
    assert.equal(res.status, 400, `role "${role}"`)
    assert.equal(res.body.field, 'role')
  }
  const res = await post('/signup', {
    name: 'Sneaky', email: 'sneaky@example.com', password: 'secret1',
    department: 'Roads & Highways', onboarded: false, passwordHash: 'x', accessCode: '1234',
  })
  assert.equal(res.status, 201)
  const stored = rows.find((r) => r.email === 'sneaky@example.com')
  assert.equal(stored.role, 'citizen')
  assert.equal(stored.department, null)
  assert.equal(stored.onboarded, true)
  assert.match(stored.passwordHash, /^\$2/)
})

test('signup: bad input gives 400 with the field', async () => {
  const good = { name: 'Farhana Akhter', email: 'farhana@example.com', password: 'secret1' }
  const cases = [
    [{ ...good, name: 'A' }, 'name'],
    [{ ...good, name: 'x'.repeat(51) }, 'name'],
    [{ ...good, name: 'Bad<script>' }, 'name'],
    [{ ...good, name: 12345 }, 'name'],
    [{ ...good, email: 'not-an-email' }, 'email'],
    [{ ...good, email: { $ne: null } }, 'email'],
    [{ ...good, password: '12345' }, 'password'],
    [{ ...good, password: 'x'.repeat(73) }, 'password'],
    [{ ...good, password: 123456 }, 'password'],
  ]
  for (const [body, field] of cases) {
    const res = await post('/signup', body)
    assert.equal(res.status, 400, JSON.stringify(body).slice(0, 60))
    assert.equal(res.body.success, false)
    assert.equal(res.body.code, 'invalid')
    assert.equal(res.body.field, field)
  }
  assert.equal((await post('/signup', {})).status, 400)
  assert.equal(rows.length, 5)
})

test('signup: a password of spaces is allowed to count, and is never trimmed', async () => {
  const res = await post('/signup', { name: 'Space Case', email: 'space@example.com', password: ' abc12 ' })
  assert.equal(res.status, 201)
  assert.equal((await login('space@example.com', ' abc12 ')).status, 200)
  assert.equal((await login('space@example.com', 'abc12')).status, 401)
})

// ---------- login ----------

test('login: the right password gives a token and the account', async () => {
  const res = await login('citizen@babylon.test', 'password123')
  assert.equal(res.status, 200)
  assert.equal(res.body.success, true)
  assert.deepEqual(res.body.data.user, {
    id: String(rows[0]._id), name: 'Demo Citizen', email: 'citizen@babylon.test',
    role: 'citizen', department: null, onboarded: true,
  })
  assert.deepEqual(verifyToken(res.body.data.token), {
    email: 'citizen@babylon.test', role: 'citizen', department: null, onboarded: true,
  })
  noLeak(res)
})

test('login: the email can be typed in any case, with spaces around it', async () => {
  const res = await login('  Citizen@BABYLON.test ', 'password123')
  assert.equal(res.status, 200)
  assert.equal(res.body.data.user.email, 'citizen@babylon.test')
})

test('login: a wrong password and an unknown email give the very same 401', async () => {
  const wrong = await login('citizen@babylon.test', 'nope-nope')
  const unknown = await login('nobody@babylon.test', 'password123')
  assert.equal(wrong.status, 401)
  assert.equal(unknown.status, 401)
  assert.deepEqual(wrong.body, unknown.body)
  assert.equal(wrong.body.code, 'unauthorized')
  assert.equal(wrong.body.field, undefined)
})

test('login: an unknown email still costs one password check (no timing hint)', async () => {
  const real = bcrypt.compare
  const seen = []
  bcrypt.compare = (...args) => { seen.push(args[1]); return real(...args) }
  try {
    await login('nobody@babylon.test', 'password123')
    // One real, full-cost comparison, so it takes as long as for a real account.
    assert.equal(seen.length, 1)
    assert.match(seen[0], /^\$2[aby]\$10\$/)
  } finally {
    bcrypt.compare = real
  }
})

test('login: password is case-sensitive and a trailing space is not ignored', async () => {
  assert.equal((await login('citizen@babylon.test', 'Password123')).status, 401)
  assert.equal((await login('citizen@babylon.test', 'password123 ')).status, 401)
})

test('login: a staff account at the citizen door is 403 staff-account', async () => {
  for (const email of ['roads@babylon.test', 'admin@babylon.test']) {
    const res = await login(email, 'password123', 'citizen')
    assert.equal(res.status, 403, email)
    assert.equal(res.body.code, 'staff-account')
    assert.equal(res.body.data, undefined)
  }
})

test('login: a citizen at the staff door is 403 citizen-account', async () => {
  const res = await login('citizen@babylon.test', 'password123', 'staff')
  assert.equal(res.status, 403)
  assert.equal(res.body.code, 'citizen-account')
})

test('login: the door is only checked after the password, so it tells strangers nothing', async () => {
  const staffAtCitizen = await login('roads@babylon.test', 'wrong-pass', 'citizen')
  const citizenAtStaff = await login('citizen@babylon.test', 'wrong-pass', 'staff')
  assert.equal(staffAtCitizen.status, 401)
  assert.equal(citizenAtStaff.status, 401)
  assert.deepEqual(staffAtCitizen.body, citizenAtStaff.body)
})

test('login: staff come through the staff door, with their department in the token', async () => {
  const dept = await login('roads@babylon.test', 'password123', 'staff')
  assert.equal(dept.status, 200)
  assert.deepEqual(verifyToken(dept.body.data.token), {
    email: 'roads@babylon.test', role: 'department', department: 'Roads & Highways', onboarded: true,
  })
  assert.equal(dept.body.data.user.department, 'Roads & Highways')

  const admin = await login('admin@babylon.test', 'password123', 'staff')
  assert.equal(admin.status, 200)
  assert.equal(verifyToken(admin.body.data.token).role, 'admin')
  noLeak(dept)
})

test('login: staff who have not finished setup get a token that says so', async () => {
  const res = await login('newstaff@babylon.test', 'password123', 'staff')
  assert.equal(res.status, 200)
  assert.equal(res.body.data.user.onboarded, false)
  assert.equal(verifyToken(res.body.data.token).onboarded, false)
})

test('login: a seeded "no login" account is a plain 401, not a crash', async () => {
  const res = await login('seeded@babylon.test', 'anything', 'staff')
  assert.equal(res.status, 401)
  assert.equal(res.body.code, 'unauthorized')
})

test('login: the door is required and must be citizen or staff', async () => {
  for (const door of [undefined, '', 'admin', 'Citizen', 5]) {
    const res = await post('/login', { email: 'citizen@babylon.test', password: 'password123', door })
    assert.equal(res.status, 400, String(door))
    assert.equal(res.body.field, 'door')
  }
})

test('login: missing or odd input is 400, and an object can not be a Mongo operator', async () => {
  const bodies = [
    {},
    { email: 'citizen@babylon.test', door: 'citizen' },
    { password: 'password123', door: 'citizen' },
    { email: { $ne: null }, password: 'password123', door: 'citizen' },
    { email: 'citizen@babylon.test', password: { $ne: null }, door: 'citizen' },
    { email: 'citizen@babylon.test', password: '', door: 'citizen' },
  ]
  for (const body of bodies) {
    const res = await post('/login', body)
    assert.equal(res.status, 400, JSON.stringify(body))
    assert.equal(res.body.code, 'invalid')
  }
})

// ---------- logout ----------

test('logout: 200 with a token, with none, and with a broken one', async () => {
  const token = (await login('citizen@babylon.test', 'password123')).body.data.token
  assert.equal((await request(app).post('/api/auth/logout').set(bearer(token))).status, 200)
  assert.equal((await request(app).post('/api/auth/logout')).status, 200)
  const res = await request(app).post('/api/auth/logout').set(bearer('garbage'))
  assert.equal(res.status, 200)
  assert.equal(res.body.success, true)
})

// ---------- me ----------

test('me: gives the signed-in account and no hash', async () => {
  const token = (await login('roads@babylon.test', 'password123', 'staff')).body.data.token
  const res = await request(app).get('/api/auth/me').set(bearer(token))
  assert.equal(res.status, 200)
  assert.deepEqual(res.body.data, {
    id: String(rows[1]._id), name: 'Roads Officer', email: 'roads@babylon.test',
    role: 'department', department: 'Roads & Highways', onboarded: true,
  })
  noLeak(res)
})

test('me: no token, a broken token, or a deleted account is 401', async () => {
  assert.equal((await request(app).get('/api/auth/me')).status, 401)
  assert.equal((await request(app).get('/api/auth/me').set(bearer('garbage'))).status, 401)
  const token = (await login('citizen@babylon.test', 'password123')).body.data.token
  rows = rows.filter((r) => r.email !== 'citizen@babylon.test')
  const res = await request(app).get('/api/auth/me').set(bearer(token))
  assert.equal(res.status, 401)
  assert.equal(res.body.code, 'unauthorized')
})

test('me: the answer follows the account, not what the token remembers', async () => {
  const token = (await login('citizen@babylon.test', 'password123')).body.data.token
  rows[0].name = 'Renamed Citizen'
  const res = await request(app).get('/api/auth/me').set(bearer(token))
  assert.equal(res.body.data.name, 'Renamed Citizen')
})

// ---------- change password ----------

const change = (token, body) => request(app).patch('/api/auth/password').set(bearer(token)).send(body)
const citizenToken = async () => (await login('citizen@babylon.test', 'password123')).body.data.token

test('change password: works, then the old password fails and the new one logs in', async () => {
  const token = await citizenToken()
  const res = await change(token, { currentPassword: 'password123', newPassword: 'brand-new-1' })
  assert.equal(res.status, 200)
  assert.equal(res.body.success, true)
  assert.equal(res.body.data, null)
  assert.equal((await login('citizen@babylon.test', 'password123')).status, 401)
  assert.equal((await login('citizen@babylon.test', 'brand-new-1')).status, 200)
  assert.match(rows[0].passwordHash, /^\$2[aby]\$10\$/)
  assert.ok(!rows[0].passwordHash.includes('brand-new-1'))
})

test('change password: the person stays signed in with the same token', async () => {
  const token = await citizenToken()
  await change(token, { currentPassword: 'password123', newPassword: 'brand-new-1' })
  assert.equal((await request(app).get('/api/auth/me').set(bearer(token))).status, 200)
})

test('change password: a wrong current password is 400 on field "current"', async () => {
  const token = await citizenToken()
  const before = rows[0].passwordHash
  const res = await change(token, { currentPassword: 'not-it', newPassword: 'brand-new-1' })
  assert.equal(res.status, 400)
  assert.equal(res.body.code, 'invalid')
  assert.equal(res.body.field, 'current')
  assert.equal(rows[0].passwordHash, before)
})

test('change password: a short or unchanged new password is 400 on field "new"', async () => {
  const token = await citizenToken()
  const short = await change(token, { currentPassword: 'password123', newPassword: '12345' })
  assert.equal(short.status, 400)
  assert.equal(short.body.field, 'new')
  const same = await change(token, { currentPassword: 'password123', newPassword: 'password123' })
  assert.equal(same.status, 400)
  assert.equal(same.body.field, 'new')
  const long = await change(token, { currentPassword: 'password123', newPassword: 'x'.repeat(73) })
  assert.equal(long.status, 400)
  assert.equal(long.body.field, 'new')
  assert.equal((await login('citizen@babylon.test', 'password123')).status, 200)
})

test('change password: missing or odd values are 400 and nothing changes', async () => {
  const token = await citizenToken()
  const cases = [
    [{}, 'current'],
    [{ newPassword: 'brand-new-1' }, 'current'],
    [{ currentPassword: 'password123' }, 'new'],
    [{ currentPassword: { $ne: null }, newPassword: 'brand-new-1' }, 'current'],
    [{ currentPassword: 'password123', newPassword: ['brand-new-1'] }, 'new'],
  ]
  for (const [body, field] of cases) {
    const res = await change(token, body)
    assert.equal(res.status, 400, JSON.stringify(body))
    assert.equal(res.body.field, field, JSON.stringify(body))
  }
  assert.equal((await login('citizen@babylon.test', 'password123')).status, 200)
})

test('change password: needs a token, and changes only the token owner', async () => {
  const body = { currentPassword: 'password123', newPassword: 'brand-new-1' }
  assert.equal((await request(app).patch('/api/auth/password').send(body)).status, 401)
  assert.equal((await change('garbage', body)).status, 401)

  // The body can not name another account.
  const token = await citizenToken()
  rows[1].passwordHash = hashes.other
  await change(token, { ...body, email: 'roads@babylon.test' })
  assert.equal(rows[1].passwordHash, hashes.other)
  assert.ok(await bcrypt.compare('brand-new-1', rows[0].passwordHash))
})

test('change password: works for staff too', async () => {
  const token = (await login('roads@babylon.test', 'password123', 'staff')).body.data.token
  const res = await change(token, { currentPassword: 'password123', newPassword: 'staff-new-1' })
  assert.equal(res.status, 200)
  assert.equal((await login('roads@babylon.test', 'staff-new-1', 'staff')).status, 200)
})

// ---------- the whole panel ----------

test('only the five auth routes exist, with the right methods', async () => {
  for (const [method, path] of [
    ['get', '/signup'], ['get', '/login'], ['get', '/logout'],
    ['post', '/me'], ['post', '/password'], ['delete', '/me'], ['put', '/password'],
  ]) {
    const res = await request(app)[method](`/api/auth${path}`)
    assert.equal(res.status, 404, `${method} ${path}`)
  }
})

test('a sign-up then a log-in then me then a password change, the way the pages do it', async () => {
  const signup = await post('/signup', { name: 'Joyti Das', email: 'joyti@example.com', password: 'first-pass' })
  assert.equal(signup.status, 201)
  const loggedIn = await login('joyti@example.com', 'first-pass')
  assert.equal(loggedIn.status, 200)
  const token = loggedIn.body.data.token
  assert.equal((await request(app).get('/api/auth/me').set(bearer(token))).body.data.name, 'Joyti Das')
  assert.equal((await change(token, { currentPassword: 'first-pass', newPassword: 'second-pass' })).status, 200)
  assert.equal((await login('joyti@example.com', 'first-pass')).status, 401)
  assert.equal((await login('joyti@example.com', 'second-pass')).status, 200)
})
