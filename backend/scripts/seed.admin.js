// Test data for the admin panel: 3 fixes waiting for the admin, 1 reopened issue,
// 40 issues over 8 weeks for Accountability, and 5 identity submissions.
//   npm run seed:admin
// Safe to run twice: it removes what it made before (rows of @seed-admin.test
// accounts) and adds it again. It never touches other rows.
// Tip: use your own database name in MONGODB_URI, for example .../babylon_meheri
import 'dotenv/config'
import mongoose from 'mongoose'
import Issue from '../src/models/issue.model.js'
import User from '../src/models/user.model.js'
import Identity from '../src/models/identity.model.js'
import { buildSeed, SEED_DOMAIN } from './seedData.js'

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('MONGODB_URI is missing. Add it to backend/.env (it is not committed).')
  process.exit(1)
}

const fromSeed = new RegExp(`@${SEED_DOMAIN.replace(/\./g, '\\.')}$`)

try {
  await mongoose.connect(uri)
  console.log(`Connected to database "${mongoose.connection.name}".`)

  await Promise.all([
    Issue.deleteMany({ reporterEmail: fromSeed }),
    Identity.deleteMany({ userEmail: fromSeed }),
    User.deleteMany({ email: fromSeed }),
  ])

  const { users, issues, identities } = buildSeed()
  await User.insertMany(users, { timestamps: false })
  await Issue.insertMany(issues, { timestamps: false })
  await Identity.insertMany(identities)

  const waiting = await Issue.countDocuments({ verification: 'awaiting' })
  const reopened = await Issue.countDocuments({ verification: 'reopened' })
  const pending = await Identity.countDocuments({ status: 'pending' })
  console.log(`Seeded ${issues.length} issues, ${identities.length} identities, ${users.length} citizens.`)
  console.log(`Now waiting for the admin: ${waiting} fixes, ${reopened} reopened, ${pending} identities.`)
} finally {
  await mongoose.disconnect()
}
