// The test "world": either in-memory fakes (default, `npm test`) or a real MongoDB
// (`npm run test:db`). The tests are the same in both, so a pass against the real
// database proves the real queries, not only the logic.
//
// Real mode uses its OWN database, "babylon_admin_test", on the server named in
// MONGODB_URI, and wipes it before every test. It never touches your other data.
import mongoose from 'mongoose'
import { fakeModel } from './fakeModel.js'
import { buildSeed, seedEmail } from '../../scripts/seedData.js'

export const useDb = process.env.USE_DB === '1'
export const TEST_DB_NAME = 'babylon_admin_test'

// Used only in fake mode: the models the services see are these proxies.
export const fakes = { issue: null, identity: null, user: null }
export const proxy = (key) =>
  new Proxy({}, { get: (_, method) => (...args) => fakes[key][method](...args) })

let real = null
async function models() {
  real ??= {
    Issue: (await import('../../src/models/issue.model.js')).default,
    Identity: (await import('../../src/models/identity.model.js')).default,
    User: (await import('../../src/models/user.model.js')).default,
  }
  return real
}

const staff = () => [
  { email: seedEmail('roads-officer'), name: 'Roads Officer', role: 'department', department: 'Roads & Highways', passwordHash: '!seed-no-login' },
  { email: seedEmail('power-officer'), name: 'Power Officer', role: 'department', department: 'Electricity', passwordHash: '!seed-no-login' },
]

export async function start() {
  if (!useDb) return
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing. Add it to backend/.env.')
  await mongoose.connect(process.env.MONGODB_URI, { dbName: TEST_DB_NAME })
}

export async function stop() {
  if (!useDb) return
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
}

// A fresh seed before every test. Returns the seed so tests can do hand sums.
export async function reset() {
  const seed = buildSeed(new Date())
  if (useDb) {
    const { Issue, Identity, User } = await models()
    await Promise.all([Issue.deleteMany({}), Identity.deleteMany({}), User.deleteMany({})])
    await User.insertMany([...seed.users, ...staff()], { timestamps: false })
    await Issue.insertMany(seed.issues, { timestamps: false })
    await Identity.insertMany(seed.identities)
  } else {
    fakes.issue = fakeModel(seed.issues)
    fakes.identity = fakeModel(seed.identities)
    fakes.user = fakeModel([...seed.users, ...staff()])
  }
  return seed
}

// ---- lookups the tests use ----
export async function issueId(title) {
  if (useDb) return String((await (await models()).Issue.findOne({ title }).lean())._id)
  return String(fakes.issue.rows.find((r) => r.title === title)._id)
}

export async function identityId(nidLast4) {
  if (useDb) return String((await (await models()).Identity.findOne({ nidLast4 }).lean())._id)
  return String(fakes.identity.rows.find((r) => r.nidLast4 === nidLast4)._id)
}

export async function issue(id) {
  if (useDb) return (await models()).Issue.findById(id).lean()
  return fakes.issue.rows.find((r) => String(r._id) === String(id))
}

// The identity record including the photo, which a normal query hides.
export async function identity(id) {
  if (useDb) return (await models()).Identity.findById(id).select('+photo').lean()
  return fakes.identity.rows.find((r) => String(r._id) === String(id))
}
