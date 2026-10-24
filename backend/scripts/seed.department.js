// backend/scripts/seed.department.js
// Test data for the department and citizen-profile panels.
// Safe to run twice. Run it from the backend/ folder.
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import User from '../src/models/user.model.js'
import Issue from '../src/models/issue.model.js'
import { buildDepartmentIssues } from './seedDepartmentData.js'

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed in production.')
  process.exit(1)
}
try {
  process.loadEnvFile('.env') // reads backend/.env
} catch {
  // no .env file: rely on real environment variables
}

const users = [
  { email: 'citizen@babylon.test', name: 'Demo Citizen', role: 'citizen', department: null, division: 'Dhaka', address: '12 Lake Road', phone: '01712345678', phoneVerified: true, onboarded: true },
  { email: 'roads@babylon.test', name: 'Roads Officer', role: 'department', department: 'Roads & Highways', onboarded: true },
  { email: 'admin@babylon.test', name: 'Demo Admin', role: 'admin', department: null, onboarded: true },
]


const issues = buildDepartmentIssues()

await mongoose.connect(process.env.MONGODB_URI)
console.log('Seeding database:', mongoose.connection.name)

const passwordHash = await bcrypt.hash('password123', 10)
for (const u of users) {
  await User.updateOne(
    { email: u.email },
    { $set: { ...u, passwordHash }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true, timestamps: false },
  )
}
for (const i of issues) {
  await Issue.replaceOne({ _id: i._id }, i, { upsert: true, timestamps: false })
}

console.log('Users:', await User.countDocuments(), 'Issues:', await Issue.countDocuments())
await mongoose.disconnect()