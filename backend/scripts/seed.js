// ONE seed for the live relay and the demo: all the panels' data together.
//   npm run seed
// What it runs, in this order:
//   1. public      the 12 sample issues with votes, and the 3 demo accounts
//                  (citizen@, roads@, admin@babylon.test, password "password123")
//   2. department  6 issues with fixed ids for the department panel
//   3. admin       fixes waiting, a reopened issue, 40 history issues, identities
//   4. citizen     2 citizens' reports, votes and notices with fixed ids (c1..., c2...)
// Rules: it refuses to run in production, and it is safe to run twice (public and
// department update the same rows, admin removes its own @seed-admin.test rows
// and adds them again). Rows have fixed ids, so the same record has the same id
// every time.
// Demo accounts are settled ONCE: the public seed's values win ("Nadia R." in
// Chattogram), so the department rows are filed by that same citizen.
// Each panel's own seed (seed:public, seed:admin, node scripts/seed.department.js)
// still exists for its own Postman file, because those files count on that panel's
// data alone.
// Tip: use your own database name in MONGODB_URI, for example .../babylon_meheri
import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import Issue from '../src/models/issue.model.js'
import User from '../src/models/user.model.js'
import Vote from '../src/models/vote.model.js'
import Identity from '../src/models/identity.model.js'
import { seedPublic } from './seedPublicData.js'
import { seedAdmin } from './seedAdminRun.js'
import { buildDepartmentIssues } from './seedDepartmentData.js'
import Alert from '../src/models/alert.model.js'
import { seedCitizen } from './seedCitizenData.js'

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed in production.')
  process.exit(1)
}

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('MONGODB_URI is missing. Add it to backend/.env (it is not committed).')
  process.exit(1)
}

try {
  await mongoose.connect(uri)
  console.log(`Seeding database "${mongoose.connection.name}".`)

  const pub = await seedPublic({ User, Issue, Vote, hashPassword: (text) => bcrypt.hash(text, 10) })
  console.log(`  public:     ${pub.users} accounts, ${pub.issues} issues, ${pub.votes} votes`)

  const departmentIssues = buildDepartmentIssues({ division: 'Chattogram', reporter: 'Nadia R.' })
  for (const issue of departmentIssues) {
    await Issue.replaceOne({ _id: issue._id }, issue, { upsert: true, timestamps: false })
  }
  console.log(`  department: ${departmentIssues.length} issues`)

  const admin = await seedAdmin({ Issue, User, Identity })
  console.log(`  admin:      ${admin.issues} issues, ${admin.identities} identities, ${admin.users} citizens`)
  console.log(`              waiting for the admin: ${admin.waiting} fixes, ${admin.reopened} reopened, ${admin.pending} identities`)
    const citizen = await seedCitizen({ User, Issue, Vote, Alert, hashPassword: (text) => bcrypt.hash(text, 10) })
  console.log(`  citizen:    ${citizen.issues} reports, ${citizen.votes} votes, ${citizen.alerts} notices`)
  console.log('Sign in with citizen@babylon.test, roads@babylon.test or admin@babylon.test (password123).')
} finally {
  await mongoose.disconnect()
}
