// Staff accounts over HTTP: sign-up, the setup checks, the phone and email codes
// and finish. The user, phone-code and email-code models are small in-memory
// fakes and the mailer is a spy. Passwords are hashed with the real bcrypt,
// tokens are the real ones, and the phone-code and email-code services are the
// real shared ones. The real database is covered by Postman
// (backend/postman/auth-public.json).
// Run: node --experimental-test-module-mocks --test tests/staff.routes.test.js
import { test, mock, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'

process.env.MONGODB_URI = 'mongodb://localhost/unused'
process.env.JWT_SECRET = 'test-secret-test-secret'
process.env.PHONE_CODE_MODE = 'dev'
process.env.EMAIL_MODE = 'dev'
process.env.STAFF_ACCESS_CODE = 'TEST-STAFF-CODE'
process.env.DEPARTMENT_CODES = JSON.stringify({ 'Roads & Highways': 'RH-1111', Electricity: 'EL-2222' })
process.env.EMPLOYEE_ROSTER = JSON.stringify({
  'Roads & Highways': ['E-RH-1', 'E-RH-2'],
  Electricity: ['E-EL-1'],
  admin: ['E-AD-1', 'E-AD-2'],
})

const url = (path) => new URL(path, import.meta.url).href

// ---------- fake user model ----------

let rows = []
const holds = (row, filter) =>
  Object.entries(filter).every(([key, want]) =>
    want && typeof want === 'object' && '$ne' in want
      ? String(row[key]) !== String(want.$ne)
      : String(row[key]) === String(want),
  )
const chain = (read) => {
  const query = {
    select() { return query },
    lean() { return query },
    then: (resolve, reject) => Promise.resolve(read()).then(resolve, reject),
  }
  return query
}
const duplicate = () => Object.assign(new Error('E11000 duplicate key'), { code: 11000 })
const claimed = (row, employeeId) =>
  employeeId && rows.some((other) => other !== row && other.employeeId === employeeId)

const FakeUser = {
  exists: (filter) => chain(() => {
    const row = rows.find((r) => holds(r, filter))
    return row ? { _id: row._id } : null
  }),
  findOne: (filter) => chain(() => {
    const row = rows.find((r) => holds(r, filter))
    if (!row) return null
    const { passwordHash, ...rest } = row
    void passwordHash
    return { ...rest }
  }),
  create: async (doc) => {
    if (rows.some((r) => r.email === doc.email)) throw duplicate()
    const row = {
      _id: new mongoose.Types.ObjectId(),
      department: null, jobTitle: '', employeeId: '', photo: '', phone: '',
      phoneVerified: false, departmentVerified: false, emailVerified: false, onboarded: true,
      ...doc,
    }
    rows.push(row)
    const { passwordHash, ...rest } = row
    void passwordHash
    return rest
  },
  updateOne: async (filter, update) => {
    const row = rows.find((r) => holds(r, filter))
    if (!row) return
    if (claimed(row, update.$set?.employeeId)) throw duplicate()
    Object.assign(row, update.$set)
  },
}
mock.module(url('../src/models/user.model.js'), { defaultExport: FakeUser })

// ---------- fake phone-code model (the service on top of it is the real one) ----------

let codes = []
let nextCodeId = 1
const same = (row, filter) => Object.entries(filter).every(([k, v]) => String(row[k]) === String(v))
mock.module(url('../src/models/phoneCode.model.js'), {
  defaultExport: {
    findOne: async (filter) => {
      const row = codes.find((r) => same(r, filter))
      return row ? { ...row } : null
    },
    findOneAndUpdate: async (filter, update, options = {}) => {
      let row = codes.find((r) => same(r, filter))
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
    deleteOne: async (filter) => { codes = codes.filter((r) => !same(r, filter)) },
  },
})

// ---------- fake email-code model and mailer spy (the email-code service is the real one) ----------

let emailRows = []
let nextEmailId = 1
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
let verifyToken
let freshRouter = 0

// A new router (and so new rate-limit counters) for every test.
async function buildApp() {
  const { default: router } = await import(`../src/auth/routes/staff.routes.js?fresh=${++freshRouter}`)
  const { default: authRouter } = await import('../src/auth/routes/auth.routes.js')
  const app = express()
  app.use(express.json({ limit: '8mb' })) // the same limit as src/app.js
  app.use('/api/auth/staff', router)
  app.use('/api/auth', authRouter)
  // A pretend department page behind the real gate, to see what a token can open.
  app.get('/api/dept', authenticate, authorize('department'), (req, res) => res.json({ ok: true }))
  app.get('/api/admin', authenticate, authorize('admin'), (req, res) => res.json({ ok: true }))
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
  ;({ signToken, verifyToken } = await import('../src/utils/token.js'))
})

let app
const ROADS = 'Roads & Highways'
const account = (extra) => ({
  _id: new mongoose.Types.ObjectId(), name: 'Someone', department: null, jobTitle: '',
  employeeId: '', photo: '', phone: '', phoneVerified: false, departmentVerified: false,
  emailVerified: false, onboarded: true, passwordHash: '!seed-no-login', ...extra,
})

beforeEach(async () => {
  codes = []
  nextCodeId = 1
  emailRows = []
  nextEmailId = 1
  mails = []
  mailFails = false
  rows = [
    account({ email: 'citizen@babylon.test', name: 'Demo Citizen', role: 'citizen' }),
    // Finished staff who already own an Employee ID.
    account({ email: 'roads@babylon.test', name: 'Roads Officer', role: 'department', department: ROADS, employeeId: 'E-RH-2' }),
  ]
  app = await buildApp()
})

const good = {
  name: 'Nusrat Jahan', email: 'nusrat@babylon.test', password: 'secret12',
  role: 'department', department: ROADS, accessCode: 'TEST-STAFF-CODE',
}
const bearer = (token) => ({ Authorization: `Bearer ${token}` })
const post = (path, body, token) => {
  const call = request(app).post(`/api/auth/staff${path}`)
  return (token ? call.set(bearer(token)) : call).send(body)
}
const patch = (path, body, token) => request(app).patch(`/api/auth/staff${path}`).set(bearer(token)).send(body)
const me = (token) => request(app).get('/api/auth/me').set(bearer(token))

// A brand-new staff account, as the sign-up page makes it. Returns its token.
async function signUp(extra = {}) {
  const res = await post('/signup', { ...good, ...extra })
  assert.equal(res.status, 201, JSON.stringify(res.body))
  return res.body.data.token
}
const tokenFor = (email, role, department = null, onboarded = true) =>
  signToken({ email, role, department, onboarded })

// ---------- sign-up ----------

test('signup: 201, a department account that is NOT onboarded, with a token that says so', async () => {
  const res = await post('/signup', good)
  assert.equal(res.status, 201)
  assert.equal(res.body.success, true)
  const { token, user } = res.body.data
  assert.equal(user.email, 'nusrat@babylon.test')
  assert.equal(user.role, 'department')
  assert.equal(user.department, ROADS)
  assert.equal(user.onboarded, false)
  assert.deepEqual(user.setupMissing, [
    'a job title', 'a verified phone number', 'a verified email address',
    'a verified Employee ID', 'a verified department code',
  ])
  assert.equal(user.emailVerified, false)
  const payload = verifyToken(token)
  assert.equal(payload.role, 'department')
  assert.equal(payload.department, ROADS)
  assert.equal(payload.onboarded, false)
  const text = JSON.stringify(res.body)
  assert.ok(!text.includes('passwordHash') && !text.includes('$2b$'), 'no hash')
  assert.ok(!text.includes('TEST-STAFF-CODE'), 'the access code is never echoed')
  assert.match(rows.at(-1).passwordHash, /^\$2[aby]\$10\$/)
})

test('signup: an admin has no department, even if one is sent; the code is not case sensitive', async () => {
  const res = await post('/signup', {
    ...good, email: 'boss@babylon.test', role: 'admin', department: ROADS, accessCode: ' test-staff-code ',
  })
  assert.equal(res.status, 201)
  assert.equal(res.body.data.user.role, 'admin')
  assert.equal(res.body.data.user.department, null)
  assert.equal(verifyToken(res.body.data.token).department, null)
  assert.ok(!res.body.data.user.setupMissing.includes('a verified department code'))
})

test('signup: a wrong or missing access code is 400 on "accessCode" and nothing is created', async () => {
  const count = rows.length
  for (const accessCode of ['nope', 'TEST-STAFF-COD', '']) {
    const res = await post('/signup', { ...good, accessCode })
    assert.equal(res.status, 400)
    assert.equal(res.body.code, 'invalid')
    assert.equal(res.body.field, 'accessCode')
  }
  const { accessCode, ...without } = good
  void accessCode
  assert.equal((await post('/signup', without)).body.field, 'accessCode')
  assert.equal(rows.length, count)
})

test('signup: with no STAFF_ACCESS_CODE on the server nobody can sign up', async () => {
  const { env } = await import('../src/config/env.js')
  const saved = env.staffAccessCode
  env.staffAccessCode = ''
  try {
    assert.equal((await post('/signup', { ...good, accessCode: '' })).status, 400)
    assert.equal((await post('/signup', { ...good, accessCode: 'undefined' })).status, 400)
  } finally {
    env.staffAccessCode = saved
  }
})

test('signup: the access code is checked before the email, so it cannot be used to find accounts', async () => {
  const res = await post('/signup', { ...good, email: 'roads@babylon.test', accessCode: 'wrong' })
  assert.equal(res.status, 400)
  assert.equal(res.body.field, 'accessCode')
})

test('signup: an email that is already taken is 409 on "email"', async () => {
  const res = await post('/signup', { ...good, email: 'ROADS@babylon.test' })
  assert.equal(res.status, 409)
  assert.equal(res.body.code, 'conflict')
  assert.equal(res.body.field, 'email')
})

test('signup: bad fields are 400 with the field named', async () => {
  const cases = [
    [{ role: 'citizen' }, 'role'],
    [{ role: 'root' }, 'role'],
    [{ role: undefined }, 'role'],
    [{ department: undefined }, 'department'],
    [{ department: 'Parks' }, 'department'],
    [{ name: 'A' }, 'name'],
    [{ email: 'not-an-email' }, 'email'],
    [{ password: '123' }, 'password'],
  ]
  for (const [change, field] of cases) {
    const res = await post('/signup', { ...good, ...change })
    assert.equal(res.status, 400, field)
    assert.equal(res.body.field, field)
  }
})

test('signup: ten tries a minute, then 429 (an access code cannot be guessed by hammering)', async () => {
  let last
  for (let i = 0; i < 11; i++) last = await post('/signup', { ...good, accessCode: `guess-${i}` })
  assert.equal(last.status, 429)
  assert.equal(last.body.code, 'too-many-requests')
})

test('the citizen sign-up page still refuses a staff role', async () => {
  const res = await request(app).post('/api/auth/signup').send({ name: 'Eve Hacker', email: 'eve@x.test', password: 'secret12', role: 'admin' })
  assert.ok(res.status === 400 || res.status === 404)
  assert.ok(!rows.some((r) => r.email === 'eve@x.test'))
})

// ---------- who may use the staff routes ----------

test('every staff route (except sign-up) needs a token: 401', async () => {
  for (const [method, path] of [
    ['post', '/verify-code'], ['post', '/verify-employee'], ['patch', '/details'],
    ['post', '/photo'], ['post', '/phone-code'], ['post', '/phone-verify'],
    ['post', '/email-code'], ['post', '/email-verify'], ['post', '/finish'],
  ]) {
    const res = await request(app)[method](`/api/auth/staff${path}`).send({})
    assert.equal(res.status, 401, path)
  }
})

test('a citizen token is 403 forbidden on every staff route', async () => {
  const token = tokenFor('citizen@babylon.test', 'citizen')
  for (const [method, path] of [
    ['post', '/verify-code'], ['post', '/verify-employee'], ['patch', '/details'],
    ['post', '/photo'], ['post', '/phone-code'], ['post', '/phone-verify'],
    ['post', '/email-code'], ['post', '/email-verify'], ['post', '/finish'],
  ]) {
    const res = await request(app)[method](`/api/auth/staff${path}`).set(bearer(token)).send({})
    assert.equal(res.status, 403, path)
    assert.equal(res.body.code, 'forbidden')
  }
})

test('a token whose account was deleted is 401', async () => {
  const token = await signUp()
  rows = rows.filter((r) => r.email !== 'nusrat@babylon.test')
  assert.equal((await post('/finish', {}, token)).status, 401)
})

// ---------- department code ----------

test('verify-code: the right code marks the department verified (any case)', async () => {
  const token = await signUp()
  const res = await post('/verify-code', { code: ' rh-1111 ' }, token)
  assert.equal(res.status, 200)
  assert.equal(res.body.data.departmentVerified, true)
  assert.ok(!res.body.data.setupMissing.includes('a verified department code'))
  assert.equal(rows.at(-1).departmentVerified, true)
})

test('verify-code: a code for another department is 400 on "code" and does not verify', async () => {
  const token = await signUp()
  const res = await post('/verify-code', { code: 'EL-2222' }, token)
  assert.equal(res.status, 400)
  assert.equal(res.body.field, 'code')
  assert.match(res.body.message, /Roads & Highways/)
  assert.ok(!JSON.stringify(res.body).includes('RH-1111'), 'the right code is never revealed')
  assert.equal(rows.at(-1).departmentVerified, false)
})

test('verify-code: an empty code is 400; an admin is 403; a department with no code on the server never passes', async () => {
  const token = await signUp()
  assert.equal((await post('/verify-code', { code: '  ' }, token)).status, 400)
  assert.equal((await post('/verify-code', {}, token)).body.field, 'code')

  const adminToken = await signUp({ email: 'admin2@babylon.test', role: 'admin' })
  const admin = await post('/verify-code', { code: 'RH-1111' }, adminToken)
  assert.equal(admin.status, 403)
  assert.equal(admin.body.code, 'forbidden')

  const water = await signUp({ email: 'water@babylon.test', department: 'Water Supply' })
  assert.equal((await post('/verify-code', { code: '' }, water)).status, 400)
  assert.equal((await post('/verify-code', { code: 'undefined' }, water)).status, 400)
})

test('verify-code: ten tries a minute, then 429', async () => {
  const token = await signUp()
  let last
  for (let i = 0; i < 11; i++) last = await post('/verify-code', { code: `try-${i}` }, token)
  assert.equal(last.status, 429)
  assert.equal(last.body.code, 'too-many-requests')
})

// ---------- employee ID ----------

test('verify-employee: an ID on the department list is saved, in capitals', async () => {
  const token = await signUp()
  const res = await post('/verify-employee', { employeeId: ' e-rh-1 ' }, token)
  assert.equal(res.status, 200)
  assert.equal(res.body.data.employeeId, 'E-RH-1')
  assert.equal(res.body.data.employeeIdVerified, true)
  assert.equal(rows.at(-1).employeeId, 'E-RH-1')
})

test('verify-employee: an admin uses the admin list; a department ID does not work for an admin', async () => {
  const token = await signUp({ email: 'boss@babylon.test', role: 'admin' })
  const wrong = await post('/verify-employee', { employeeId: 'E-RH-1' }, token)
  assert.equal(wrong.status, 400)
  assert.equal(wrong.body.field, 'employeeId')
  assert.match(wrong.body.message, /admin staff list/)
  assert.equal((await post('/verify-employee', { employeeId: 'E-AD-1' }, token)).status, 200)
})

test('verify-employee: an ID from another department, or not on any list, is 400', async () => {
  const token = await signUp()
  for (const employeeId of ['E-EL-1', 'E-AD-1', 'E-RH-999', 'x']) {
    const res = await post('/verify-employee', { employeeId }, token)
    assert.equal(res.status, 400, employeeId)
    assert.match(res.body.message, /Roads & Highways staff list/)
  }
  assert.equal(rows.at(-1).employeeId, '')
  assert.equal((await post('/verify-employee', { employeeId: '' }, token)).status, 400)
})

test('verify-employee: an ID linked to another account is 409, and that account is not named', async () => {
  const token = await signUp()
  const res = await post('/verify-employee', { employeeId: 'E-RH-2' }, token)
  assert.equal(res.status, 409)
  assert.equal(res.body.code, 'conflict')
  assert.ok(!JSON.stringify(res.body).includes('roads@babylon.test'))
  assert.equal(rows.at(-1).employeeId, '')
})

test('verify-employee: two accounts claiming the same ID at once, only one wins (unique index)', async () => {
  const first = await signUp()
  const second = await signUp({ email: 'second@babylon.test' })
  // The second account passes the "taken?" check before the first has saved.
  const real = FakeUser.exists
  let calls = 0
  FakeUser.exists = (filter) => (filter.employeeId && calls++ === 1 ? chain(() => null) : real(filter))
  try {
    const a = await post('/verify-employee', { employeeId: 'E-RH-1' }, first)
    const b = await post('/verify-employee', { employeeId: 'E-RH-1' }, second)
    assert.equal(a.status, 200)
    assert.equal(b.status, 409)
  } finally {
    FakeUser.exists = real
  }
})

test('verify-employee: asking again for the same ID is fine; a different one is locked (409)', async () => {
  const token = await signUp()
  await post('/verify-employee', { employeeId: 'E-RH-1' }, token)
  assert.equal((await post('/verify-employee', { employeeId: 'e-rh-1' }, token)).status, 200)
  const res = await post('/verify-employee', { employeeId: 'E-RH-2' }, token)
  assert.equal(res.status, 409)
  assert.match(res.body.message, /cannot be changed/)
})

// ---------- details ----------

test('details: saves the name and the job title', async () => {
  const token = await signUp()
  const res = await patch('/details', { name: 'Nusrat J. Khan', jobTitle: '  Road inspector ' }, token)
  assert.equal(res.status, 200)
  assert.equal(res.body.data.name, 'Nusrat J. Khan')
  assert.equal(res.body.data.jobTitle, 'Road inspector')
  assert.ok(!res.body.data.setupMissing.includes('a job title'))
})

test('details: one field alone is fine; nothing at all is 400', async () => {
  const token = await signUp()
  assert.equal((await patch('/details', { jobTitle: 'Clerk' }, token)).status, 200)
  assert.equal(rows.at(-1).name, 'Nusrat Jahan')
  const none = await patch('/details', {}, token)
  assert.equal(none.status, 400)
})

test('details: a bad job title or name is 400 with the field', async () => {
  const token = await signUp()
  for (const [body, field] of [
    [{ jobTitle: 'x' }, 'jobTitle'],
    [{ jobTitle: 'y'.repeat(61) }, 'jobTitle'],
    [{ jobTitle: 7 }, 'jobTitle'],
    [{ name: 'A' }, 'name'],
    [{ name: 'Bad<script>' }, 'name'],
  ]) {
    const res = await patch('/details', body, token)
    assert.equal(res.status, 400, JSON.stringify(body))
    assert.equal(res.body.field, field)
  }
})

test('details: an Employee ID sent here is ignored, it can only come from the roster check', async () => {
  const token = await signUp()
  const res = await patch('/details', { jobTitle: 'Clerk', employeeId: 'E-RH-1', onboarded: true, role: 'admin' }, token)
  assert.equal(res.status, 200)
  const row = rows.at(-1)
  assert.equal(row.employeeId, '')
  assert.equal(row.onboarded, false)
  assert.equal(row.role, 'department')
})

// ---------- photo ----------

const PIXEL = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=='

test('photo: a small image is saved, shows on /auth/me, and "" removes it', async () => {
  const token = await signUp()
  const saved = await post('/photo', { photo: PIXEL }, token)
  assert.equal(saved.status, 200)
  assert.equal(saved.body.data.photo, PIXEL)
  assert.equal((await me(token)).body.data.photo, PIXEL)
  const removed = await post('/photo', { photo: '' }, token)
  assert.equal(removed.status, 200)
  assert.equal(removed.body.data.photo, '')
})

test('photo: not an image, an SVG, a missing field or a huge file is 400 on "photo"', async () => {
  const token = await signUp()
  const huge = `data:image/png;base64,${'A'.repeat(300_001)}`
  for (const photo of [
    'hello', 'data:text/html;base64,PGI+', 'data:image/svg+xml;base64,PHN2Zz4=',
    'data:image/png;base64,not base64!', 12, huge,
  ]) {
    const res = await post('/photo', { photo }, token)
    assert.equal(res.status, 400, String(photo).slice(0, 30))
    assert.equal(res.body.field, 'photo')
  }
  assert.equal((await post('/photo', {}, token)).status, 400)
  assert.equal(rows.at(-1).photo, '')
})

// ---------- phone code ----------

test('phone-code: sends a code, normalises +880, and answers with the number and the wait', async () => {
  const token = await signUp()
  const res = await post('/phone-code', { phone: '+880 1711-000111' }, token)
  assert.equal(res.status, 200)
  assert.deepEqual(res.body.data, { phone: '01711000111', resendAfter: 30 })
  assert.equal(codes.length, 1)
  assert.ok(!JSON.stringify(res.body).includes('123456'), 'the code is never sent back')
})

test('phone-code: a bad number is 400 on "phone"', async () => {
  const token = await signUp()
  for (const phone of ['', '12345', '01211000111', 'abcdefghijk', '017110001112', 5]) {
    const res = await post('/phone-code', { phone }, token)
    assert.equal(res.status, 400, String(phone))
    assert.equal(res.body.field, 'phone')
  }
  assert.equal(codes.length, 0)
})

test('phone-code: asking again at once is 429, with the seconds to wait', async () => {
  const token = await signUp()
  assert.equal((await post('/phone-code', { phone: '01711000111' }, token)).status, 200)
  const again = await post('/phone-code', { phone: '01711000111' }, token)
  assert.equal(again.status, 429)
  assert.equal(again.body.code, 'too-many-requests')
  assert.match(again.body.message, /wait \d+ seconds/)
})

test('phone-code: with phone codes switched off on the server it is a 500, never a fake success', async () => {
  const { env } = await import('../src/config/env.js')
  env.phoneCodeMode = 'off'
  try {
    const token = await signUp()
    const res = await post('/phone-code', { phone: '01711000111' }, token)
    assert.equal(res.status, 500)
  } finally {
    env.phoneCodeMode = 'dev'
  }
})

// ---------- phone verify ----------

test('phone-verify: the right code saves the number and marks it verified', async () => {
  const token = await signUp()
  await post('/phone-code', { phone: '01711000111' }, token)
  const res = await post('/phone-verify', { phone: '01711000111', code: '123456' }, token)
  assert.equal(res.status, 200)
  assert.equal(res.body.data.phone, '01711000111')
  assert.equal(res.body.data.phoneVerified, true)
  assert.ok(!res.body.data.setupMissing.includes('a verified phone number'))
  assert.equal(rows.at(-1).phone, '01711000111')
  assert.equal(codes.length, 0, 'a used code is gone')
})

test('phone-verify: a wrong code counts down, then the account is locked (423)', async () => {
  const token = await signUp()
  await post('/phone-code', { phone: '01711000111' }, token)
  const body = { phone: '01711000111', code: '000000' }
  const one = await post('/phone-verify', body, token)
  assert.equal(one.status, 400)
  assert.equal(one.body.field, 'code')
  assert.match(one.body.message, /2 tries left/)
  assert.match((await post('/phone-verify', body, token)).body.message, /1 try left/)
  const locked = await post('/phone-verify', body, token)
  assert.equal(locked.status, 423)
  assert.equal(locked.body.code, 'locked')
  assert.equal((await post('/phone-verify', { ...body, code: '123456' }, token)).status, 423)
  assert.equal(rows.at(-1).phoneVerified, false)
})

test('phone-verify: no code asked for, or a different number, is 400 "expired"; a missing code is 400', async () => {
  const token = await signUp()
  const none = await post('/phone-verify', { phone: '01711000111', code: '123456' }, token)
  assert.equal(none.status, 400)
  assert.equal(none.body.field, 'code')
  await post('/phone-code', { phone: '01711000111' }, token)
  const other = await post('/phone-verify', { phone: '01811000222', code: '123456' }, token)
  assert.equal(other.status, 400)
  assert.equal((await post('/phone-verify', { phone: '01711000111' }, token)).body.field, 'code')
  assert.equal(rows.at(-1).phoneVerified, false)
})

// ---------- email code and email verify ----------

test('email-code: 200, the code goes to the account\'s own email and is never in the answer', async () => {
  const { env } = await import('../src/config/env.js')
  env.emailMode = 'smtp'
  try {
    const token = await signUp()
    const res = await post('/email-code', {}, token)
    assert.equal(res.status, 200)
    assert.deepEqual(res.body.data, { email: 'nusrat@babylon.test', resendAfter: 30 })
    assert.equal(mails.length, 1)
    assert.equal(mails[0].to, 'nusrat@babylon.test')
    assert.match(mails[0].subject, /verification/i)
    const sent = mails[0].text.match(/\b(\d{6})\b/)?.[1]
    assert.ok(sent, 'the mail carries a 6-digit code')
    assert.ok(!JSON.stringify(res.body).includes(sent), 'the code is not in the answer')
    assert.ok(!JSON.stringify(emailRows).includes(sent), 'only a hash is stored')
    assert.equal(emailRows.length, 1)
    assert.equal(emailRows[0].purpose, 'verify')
    // The emailed code is the one that verifies.
    const ok = await post('/email-verify', { code: sent }, token)
    assert.equal(ok.status, 200)
    assert.equal(ok.body.data.emailVerified, true)
  } finally {
    env.emailMode = 'dev'
  }
})

test('email-code: it cannot be sent to another address, whatever the body says', async () => {
  const token = await signUp()
  const res = await post('/email-code', { email: 'victim@example.com' }, token)
  assert.equal(res.status, 200)
  assert.equal(res.body.data.email, 'nusrat@babylon.test')
  assert.equal(emailRows[0].email, 'nusrat@babylon.test')
})

test('email-code: in dev mode nothing is mailed and the fixed code works', async () => {
  const token = await signUp()
  assert.equal((await post('/email-code', {}, token)).status, 200)
  assert.equal(mails.length, 0)
  assert.equal((await post('/email-verify', { code: '123456' }, token)).status, 200)
})

test('email-code: asking again at once is 429, with the seconds to wait', async () => {
  const token = await signUp()
  assert.equal((await post('/email-code', {}, token)).status, 200)
  const again = await post('/email-code', {}, token)
  assert.equal(again.status, 429)
  assert.equal(again.body.code, 'too-many-requests')
  assert.match(again.body.message, /wait \d+ seconds/)
})

test('email-code: an address that is already verified is 409 and nothing is sent', async () => {
  const token = await signUp()
  await post('/email-code', {}, token)
  await post('/email-verify', { code: '123456' }, token)
  const res = await post('/email-code', {}, token)
  assert.equal(res.status, 409)
  assert.equal(res.body.code, 'conflict')
  assert.equal(mails.length, 0)
})

test('email-code: with email codes switched off it is a 500, never a fake success', async () => {
  const { env } = await import('../src/config/env.js')
  env.emailMode = 'off'
  try {
    const token = await signUp()
    const res = await post('/email-code', {}, token)
    assert.equal(res.status, 500)
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
    const token = await signUp()
    const res = await post('/email-code', {}, token)
    assert.equal(res.status, 503)
    assert.equal(res.body.code, 'email-unavailable')
    assert.equal(emailRows.length, 0)
  } finally {
    env.emailMode = 'dev'
  }
})

test('email-verify: the right code marks the email verified and is used up', async () => {
  const token = await signUp()
  await post('/email-code', {}, token)
  const res = await post('/email-verify', { code: ' 123456 ' }, token)
  assert.equal(res.status, 200)
  assert.equal(res.body.data.emailVerified, true)
  assert.ok(!res.body.data.setupMissing.includes('a verified email address'))
  assert.equal(rows.at(-1).emailVerified, true)
  assert.equal(emailRows.length, 0, 'a used code is gone')
  assert.equal((await me(token)).body.data.emailVerified, true)
})

test('email-verify: a wrong code is 400 on "code", the third wrong one locks it (423)', async () => {
  const token = await signUp()
  await post('/email-code', {}, token)
  const body = { code: '000000' }
  for (let i = 0; i < 2; i++) {
    const wrong = await post('/email-verify', body, token)
    assert.equal(wrong.status, 400)
    assert.equal(wrong.body.code, 'invalid')
    assert.equal(wrong.body.field, 'code')
  }
  const locked = await post('/email-verify', body, token)
  assert.equal(locked.status, 423)
  assert.equal(locked.body.code, 'locked')
  assert.equal((await post('/email-verify', { code: '123456' }, token)).status, 423, 'even the right code, until a new one is asked for')
  assert.equal(rows.at(-1).emailVerified, false)
})

test('email-verify: no code asked for is 400 on "code"; a missing code is 400 too', async () => {
  const token = await signUp()
  const none = await post('/email-verify', { code: '123456' }, token)
  assert.equal(none.status, 400)
  assert.equal(none.body.field, 'code')
  const missing = await post('/email-verify', {}, token)
  assert.equal(missing.status, 400)
  assert.equal(missing.body.field, 'code')
  assert.equal(rows.at(-1).emailVerified, false)
})

test('email-verify: one person\'s code does not verify another account', async () => {
  const first = await signUp()
  await post('/email-code', {}, first)
  const second = await signUp({ email: 'other@babylon.test', name: 'Other Person' })
  const res = await post('/email-verify', { code: '123456' }, second)
  assert.equal(res.status, 400)
  assert.equal(rows.find((r) => r.email === 'other@babylon.test').emailVerified, false)
})

test('email-verify: an address that is already verified just returns the profile', async () => {
  const token = await signUp()
  await post('/email-code', {}, token)
  await post('/email-verify', { code: '123456' }, token)
  const again = await post('/email-verify', { code: '000000' }, token)
  assert.equal(again.status, 200)
  assert.equal(again.body.data.emailVerified, true)
})

test('the email check holds back only accounts still setting up', async () => {
  // Finished before the email check existed: everything else done, email never verified.
  rows.push(account({
    email: 'veteran@babylon.test', name: 'Veteran Officer', role: 'department', department: ROADS,
    jobTitle: 'Officer', employeeId: 'E-RH-1', phone: '01711000111', phoneVerified: true,
    departmentVerified: true, onboarded: true,
  }))
  const token = tokenFor('veteran@babylon.test', 'department', ROADS)
  assert.deepEqual((await me(token)).body.data.setupMissing, [])
  const res = await post('/finish', {}, token)
  assert.equal(res.status, 200)
  assert.equal(res.body.data.user.emailVerified, false)
})

// ---------- finish, and /auth/me ----------

test('finish: before the required steps are done it is 409 and nothing changes', async () => {
  const token = await signUp()
  await patch('/details', { jobTitle: 'Clerk' }, token)
  const res = await post('/finish', {}, token)
  assert.equal(res.status, 409)
  assert.equal(res.body.code, 'conflict')
  assert.equal(rows.at(-1).onboarded, false)
  assert.equal((await request(app).get('/api/dept').set(bearer(token))).status, 403)
})

// Does every step the way the profile page does.
async function completeSetup(token, { admin = false } = {}) {
  assert.equal((await patch('/details', { jobTitle: 'Officer' }, token)).status, 200)
  assert.equal((await post('/verify-employee', { employeeId: admin ? 'E-AD-1' : 'E-RH-1' }, token)).status, 200)
  assert.equal((await post('/phone-code', { phone: '01711000111' }, token)).status, 200)
  assert.equal((await post('/phone-verify', { phone: '01711000111', code: '123456' }, token)).status, 200)
  assert.equal((await post('/email-code', {}, token)).status, 200)
  assert.equal((await post('/email-verify', { code: '123456' }, token)).status, 200)
  if (!admin) assert.equal((await post('/verify-code', { code: 'RH-1111' }, token)).status, 200)
}

test('finish: the whole journey, and the new token opens the department area while the old one does not', async () => {
  const oldToken = await signUp()
  assert.equal((await request(app).get('/api/dept').set(bearer(oldToken))).status, 403)
  assert.equal((await me(oldToken)).body.data.onboarded, false)

  await completeSetup(oldToken)
  assert.deepEqual((await me(oldToken)).body.data.setupMissing, [])

  const res = await post('/finish', {}, oldToken)
  assert.equal(res.status, 200)
  const { token, user } = res.body.data
  assert.equal(user.onboarded, true)
  assert.deepEqual(user.setupMissing, [])
  assert.equal(verifyToken(token).onboarded, true)
  assert.equal(rows.at(-1).onboarded, true)

  assert.equal((await request(app).get('/api/dept').set(bearer(token))).status, 200)
  assert.equal((await request(app).get('/api/dept').set(bearer(oldToken))).status, 403, 'the old token is still stuck')
  assert.equal((await me(token)).body.data.onboarded, true)
})

test('finish: an admin needs no department code, and the new token opens the admin area (D13)', async () => {
  const oldToken = await signUp({ email: 'boss@babylon.test', role: 'admin' })
  assert.equal((await request(app).get('/api/admin').set(bearer(oldToken))).status, 403)
  await completeSetup(oldToken, { admin: true })
  const res = await post('/finish', {}, oldToken)
  assert.equal(res.status, 200)
  assert.equal((await request(app).get('/api/admin').set(bearer(res.body.data.token))).status, 200)
})

test('finish: asking again is fine and gives a fresh working token', async () => {
  const token = await signUp()
  await completeSetup(token)
  const first = await post('/finish', {}, token)
  const second = await post('/finish', {}, first.body.data.token)
  assert.equal(second.status, 200)
  assert.equal(verifyToken(second.body.data.token).onboarded, true)
})

test('finish: each missing step blocks it', async () => {
  for (const skip of ['details', 'employee', 'phone', 'email', 'department']) {
    rows = rows.filter((r) => r.email !== 'nusrat@babylon.test')
    const token = await signUp()
    if (skip !== 'details') await patch('/details', { jobTitle: 'Officer' }, token)
    if (skip !== 'employee') await post('/verify-employee', { employeeId: 'E-RH-1' }, token)
    if (skip !== 'phone') {
      await post('/phone-code', { phone: '01711000111' }, token)
      await post('/phone-verify', { phone: '01711000111', code: '123456' }, token)
    }
    if (skip !== 'email') {
      await post('/email-code', {}, token)
      await post('/email-verify', { code: '123456' }, token)
    }
    if (skip !== 'department') await post('/verify-code', { code: 'RH-1111' }, token)
    const res = await post('/finish', {}, token)
    assert.equal(res.status, 409, skip)
    app = await buildApp() // new rate-limit counters for the next round
  }
})

test('me: a citizen gets the plain account, staff also get their saved details and what is missing', async () => {
  const citizen = await me(tokenFor('citizen@babylon.test', 'citizen'))
  assert.deepEqual(Object.keys(citizen.body.data).sort(), ['department', 'email', 'id', 'name', 'onboarded', 'role'])

  const token = await signUp()
  await patch('/details', { jobTitle: 'Clerk' }, token)
  await post('/photo', { photo: PIXEL }, token)
  const res = await me(token)
  assert.equal(res.status, 200)
  assert.equal(res.body.data.jobTitle, 'Clerk')
  assert.equal(res.body.data.photo, PIXEL)
  assert.equal(res.body.data.employeeIdVerified, false)
  assert.deepEqual(res.body.data.setupMissing, [
    'a verified phone number', 'a verified email address',
    'a verified Employee ID', 'a verified department code',
  ])
  assert.ok(!JSON.stringify(res.body).includes('passwordHash'))
})

test('no answer ever contains a secret from the server: codes, roster, other accounts', async () => {
  const token = await signUp()
  const seen = []
  seen.push(await post('/verify-code', { code: 'wrong' }, token))
  seen.push(await post('/verify-employee', { employeeId: 'wrong' }, token))
  seen.push(await post('/verify-employee', { employeeId: 'E-RH-2' }, token))
  seen.push(await me(token))
  const text = JSON.stringify(seen.map((res) => res.body))
  for (const secret of ['TEST-STAFF-CODE', 'RH-1111', 'EL-2222', 'E-RH-1', 'E-AD-1', 'E-EL-1', 'roads@babylon.test']) {
    assert.ok(!text.includes(secret), secret)
  }
})
