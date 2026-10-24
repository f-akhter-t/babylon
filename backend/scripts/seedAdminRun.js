// Writes the admin seed (see seedData.js) into the database. Used by seed.admin.js
// and by the shared seed.js. Every row has a FIXED id, so Postman and the live
// relay can name the same rows on every run.
// Safe to run twice: it removes what it made before (rows of @seed-admin.test
// accounts) and adds it again. It never touches other rows.
import mongoose from 'mongoose'
import { buildSeed, SEED_DOMAIN } from './seedData.js'

const fromSeed = new RegExp(`@${SEED_DOMAIN.replace(/\./g, '\\.')}$`)

// 'ad' + a counter in hex, 24 characters in all. 'ad...' for issues, 'ae...' for
// identity submissions, so they can never collide with each other or with the
// department seed ('a1b2c3...').
export const fixedId = (prefix, n) =>
  new mongoose.Types.ObjectId(prefix + n.toString(16).padStart(22, '0'))

export function withFixedIds({ users, issues, identities }) {
  return {
    users,
    issues: issues.map((issue, i) => ({ _id: fixedId('ad', i + 1), ...issue })),
    identities: identities.map((item, i) => ({ _id: fixedId('ae', i + 1), ...item })),
  }
}

// models: { Issue, User, Identity }
export async function seedAdmin({ Issue, User, Identity, now = new Date() }) {
  await Promise.all([
    Issue.deleteMany({ reporterEmail: fromSeed }),
    Identity.deleteMany({ userEmail: fromSeed }),
    User.deleteMany({ email: fromSeed }),
  ])

  const { users, issues, identities } = withFixedIds(buildSeed(now))
  await User.insertMany(users, { timestamps: false })
  await Issue.insertMany(issues, { timestamps: false })
  await Identity.insertMany(identities)

  const waiting = await Issue.countDocuments({ verification: 'awaiting' })
  const reopened = await Issue.countDocuments({ verification: 'reopened' })
  const pending = await Identity.countDocuments({ status: 'pending' })
  return { users: users.length, issues: issues.length, identities: identities.length, waiting, reopened, pending }
}
