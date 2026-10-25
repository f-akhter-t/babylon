// The citizen seed: two citizens, five reports with FIXED ids, the reporters'
// own votes, and three notices. Used by seed.citizen.js and the shared seed.js.
// Ids: c1... for reports, c2... for notices (never collide with ad, ae, a1b2c3).
// Safe to run twice: every row is written by its fixed id.
import mongoose from 'mongoose'
import { MESSAGES } from '../src/constants/messages/citizen.js'

export const CITIZEN_EMAIL = 'citizen@babylon.test'
export const OTHER_EMAIL = 'other@babylon.test'

export const citizenId = (prefix, n) =>
  new mongoose.Types.ObjectId(prefix + n.toString(16).padStart(22, '0'))

const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const daysAgo = (now, n) => new Date(now.getTime() - n * 86400000)

export function buildCitizenSeed(now = new Date()) {
  const place = { division: 'Chattogram', location: 'Chattogram', ward: 'Ward 15', lat: 22.3569, lng: 91.7832 }
  const mine = { reporter: 'Nadia R.', reporterEmail: CITIZEN_EMAIL, beforeImg: PIXEL, verification: 'none', priority: 'medium' }

  const issues = [
    // 1 open: edit, delete, get one
    { ...place, ...mine, title: 'Pothole near the main gate', category: 'Roads', description: 'Big pothole near the main gate that is dangerous for bikes.', status: 'open', createdAt: daysAgo(now, 3) },
    // 2 open: vote and delete
    { ...place, ...mine, title: 'Overflowing bin at the corner', category: 'Waste', description: 'The bin has not been emptied for a week.', status: 'open', createdAt: daysAgo(now, 2) },
    // 3 in progress: edit and delete must answer 423
    { ...place, ...mine, title: 'Broken streetlight on Station Road', category: 'Lighting', description: 'The streetlight has been dark for days.', status: 'in-progress', startedAt: daysAgo(now, 1), createdAt: daysAgo(now, 6) },
    // 4 resolved: a vote must answer 409
    { ...place, ...mine, title: 'Leaking pipe on Hill Road', category: 'Water', description: 'Water was leaking onto the road.', status: 'resolved', priority: 'fix-verified', verification: 'verified', startedAt: daysAgo(now, 9), resolvedAt: daysAgo(now, 5), afterImg: PIXEL, createdAt: daysAgo(now, 12) },
    // 5 belongs to the OTHER citizen: citizen@ must get 403 on it
    { ...place, reporter: 'Other Citizen', reporterEmail: OTHER_EMAIL, beforeImg: PIXEL, verification: 'none', priority: 'medium', title: 'Cracked footbridge rail', category: 'Bridges', description: 'The rail is cracked and loose.', status: 'open', createdAt: daysAgo(now, 4) },
  ].map((issue, i) => ({ _id: citizenId('c1', i + 1), ...issue }))

  // The reporter's own vote, as createReport does it.
  const votes = issues.map((issue) => ({
    issueId: issue._id,
    userEmail: issue.reporterEmail,
    createdAt: issue.createdAt,
  }))

  const alerts = [
    { kind: 'filed', text: MESSAGES.reportFiled(issues[0].title), link: '/my-reports', issueId: issues[0]._id, read: false, createdAt: daysAgo(now, 3) },
    { kind: 'filed', text: MESSAGES.reportFiled(issues[1].title), link: '/my-reports', issueId: issues[1]._id, read: false, createdAt: daysAgo(now, 2) },
    { kind: 'level-up', text: MESSAGES.levelUp(2, 'Reporter'), link: '/my-reports', issueId: null, read: true, createdAt: daysAgo(now, 1) },
  ].map((alert, i) => ({ _id: citizenId('c2', i + 1), recipient: CITIZEN_EMAIL, ...alert }))

  return {
    citizen: { email: CITIZEN_EMAIL, name: 'Nadia R.', role: 'citizen', division: 'Chattogram', onboarded: true },
    other: { email: OTHER_EMAIL, name: 'Other Citizen', role: 'citizen', division: 'Chattogram', onboarded: true },
    issues,
    votes,
    alerts,
  }
}

// models: { User, Issue, Vote, Alert }. hashPassword: (text) => Promise<hash>.
export async function seedCitizen({ User, Issue, Vote, Alert, hashPassword, now = new Date() }) {
  const seed = buildCitizenSeed(now)
  const passwordHash = await hashPassword('password123')

  // citizen@ belongs to the public seed: create it only when missing, never overwrite.
  await User.updateOne(
    { email: CITIZEN_EMAIL },
    { $setOnInsert: { ...seed.citizen, passwordHash } },
    { upsert: true, timestamps: false },
  )
  await User.updateOne(
    { email: OTHER_EMAIL },
    { $set: { ...seed.other, passwordHash } },
    { upsert: true, timestamps: false },
  )

  for (const issue of seed.issues) {
    await Issue.replaceOne({ _id: issue._id }, issue, { upsert: true, timestamps: false })
  }
  for (const vote of seed.votes) {
    await Vote.updateOne(
      { issueId: vote.issueId, userEmail: vote.userEmail },
      { $setOnInsert: vote },
      { upsert: true, timestamps: false },
    )
  }
  for (const alert of seed.alerts) {
    await Alert.replaceOne({ _id: alert._id }, alert, { upsert: true })
  }

  return {
    users: 2,
    issues: seed.issues.length,
    votes: seed.votes.length,
    alerts: seed.alerts.length,
    ids: seed.issues.map((issue) => String(issue._id)),
  }
}