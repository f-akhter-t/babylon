// Test data for the citizen panel (citizen.json). Safe to run twice.
// Run from the backend/ folder:  npm run seed:citizen
import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import User from '../src/models/user.model.js'
import Issue from '../src/models/issue.model.js'
import Vote from '../src/models/vote.model.js'
import Alert from '../src/models/alert.model.js'
import { seedCitizen } from './seedCitizenData.js'

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed in production.')
  process.exit(1)
}
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is missing. Add it to backend/.env (it is not committed).')
  process.exit(1)
}

try {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log(`Seeding database "${mongoose.connection.name}".`)
  const result = await seedCitizen({ User, Issue, Vote, Alert, hashPassword: (text) => bcrypt.hash(text, 10) })
  console.log(`  citizen: ${result.users} accounts, ${result.issues} reports, ${result.votes} votes, ${result.alerts} notices`)
  console.log('Report ids for Postman:')
  const labels = ['open (edit, delete)', 'open (vote, delete)', 'in-progress (423)', 'resolved (vote 409)', "other citizen's (403)"]
  result.ids.forEach((id, i) => console.log(`  ${i + 1}. ${id}  ${labels[i]}`))
  console.log('Sign in as citizen@babylon.test or other@babylon.test (password123).')
} finally {
  await mongoose.disconnect()
}