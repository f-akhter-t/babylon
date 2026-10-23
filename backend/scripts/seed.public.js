// Test data for the public panel: 12 issues with their votes, and the 3 demo
// accounts (citizen@, roads@, admin@babylon.test, password "password123").
//   npm run seed:public
// Safe to run twice: it updates the same rows and never deletes anything.
// Tip: use your own database name in MONGODB_URI, for example .../babylon_farhana
import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import Issue from '../src/models/issue.model.js'
import User from '../src/models/user.model.js'
import Vote from '../src/models/vote.model.js'
import { seedPublic } from './seedPublicData.js'

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('MONGODB_URI is missing. Add it to backend/.env (it is not committed).')
  process.exit(1)
}

try {
  await mongoose.connect(uri)
  console.log(`Connected to database "${mongoose.connection.name}".`)
  const result = await seedPublic({
    User,
    Issue,
    Vote,
    hashPassword: (text) => bcrypt.hash(text, 10),
  })
  console.log(`Seeded ${result.users} accounts, ${result.issues} issues and ${result.votes} votes.`)
  console.log('Sign in with citizen@babylon.test, roads@babylon.test or admin@babylon.test (password123).')
} finally {
  await mongoose.disconnect()
}
