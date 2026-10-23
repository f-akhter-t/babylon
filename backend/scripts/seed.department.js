// backend/scripts/seed.department.js
// Test data for the department and citizen-profile panels.
// Safe to run twice. Run it from the backend/ folder.
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import User from '../src/models/user.model.js'
import Issue from '../src/models/issue.model.js'

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed in production.')
  process.exit(1)
}
try {
  process.loadEnvFile('.env') // reads backend/.env
} catch {
  // no .env file: rely on real environment variables
}

// Fixed ids so Postman can use the same ids on every run.
const id = (n) => new mongoose.Types.ObjectId('a1b2c3'.padEnd(23, '0') + n)
const daysAgo = (n) => new Date(Date.now() - n * 86400000)
const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

const users = [
  { email: 'citizen@babylon.test', name: 'Demo Citizen', role: 'citizen', department: null, division: 'Dhaka', address: '12 Lake Road', phone: '01712345678', phoneVerified: true, onboarded: true },
  { email: 'roads@babylon.test', name: 'Roads Officer', role: 'department', department: 'Roads & Highways', onboarded: true },
  { email: 'admin@babylon.test', name: 'Demo Admin', role: 'admin', department: null, onboarded: true },
]

const base = {
  description: 'Seed issue for testing.',
  location: 'Test Street',
  division: 'Dhaka',
  reporter: 'Demo Citizen',
  reporterEmail: 'citizen@babylon.test',
  status: 'open',
  priority: 'medium',
  verification: 'none',
}

const issues = [
  // 1 Roads, open: roads@ must see it. Use it for "start work".
  { ...base, _id: id(1), title: 'Pothole on Lake Road', category: 'Roads', beforeImg: PIXEL, createdAt: daysAgo(5) },
  // 2 Roads, in progress: use it for "submit for verification".
  { ...base, _id: id(2), title: 'Broken divider near market', category: 'Roads', status: 'in-progress', startedAt: daysAgo(2), beforeImg: PIXEL, createdAt: daysAgo(9) },
  // 3 Bridges, open: roads@ must see it (Bridges belongs to Roads & Highways).
  { ...base, _id: id(3), title: 'Cracked footbridge rail', category: 'Bridges', priority: 'high', createdAt: daysAgo(4) },
  // 4 Waste, open: roads@ must NOT see it.
  { ...base, _id: id(4), title: 'Overflowing bin at corner', category: 'Waste', createdAt: daysAgo(3) },
  // 5 Roads, reopened: must be left out of "assigned".
  { ...base, _id: id(5), title: 'Pothole came back on Mill Road', category: 'Roads', priority: 'reopened', verification: 'reopened', reopenedAt: daysAgo(1), createdAt: daysAgo(20) },
  // 6 Roads, resolved: shows in "completed".
  { ...base, _id: id(6), title: 'Fixed drain cover', category: 'Roads', status: 'resolved', priority: 'fix-verified', verification: 'verified', startedAt: daysAgo(8), resolvedAt: daysAgo(3), afterImg: PIXEL, beforeImg: PIXEL, createdAt: daysAgo(12) },
]

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