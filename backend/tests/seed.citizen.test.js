// The citizen seed's pieces: fixed ids, the shapes the citizen tests rely on.
// The database itself is not used.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import Issue from '../src/models/issue.model.js'
import Vote from '../src/models/vote.model.js'
import Alert from '../src/models/alert.model.js'
import { buildSeed } from '../scripts/seedData.js'
import { withFixedIds } from '../scripts/seedAdminRun.js'
import { buildDepartmentIssues } from '../scripts/seedDepartmentData.js'
import { buildCitizenSeed, citizenId, CITIZEN_EMAIL, OTHER_EMAIL } from '../scripts/seedCitizenData.js'

const NOW = new Date('2026-10-23T12:00:00Z')

test('a citizen id is a valid 24-character id and is the same every time', () => {
  assert.equal(String(citizenId('c1', 1)).length, 24)
  assert.ok(mongoose.isValidObjectId(String(citizenId('c1', 1))))
  assert.equal(String(citizenId('c1', 1)), String(citizenId('c1', 1)))
  assert.notEqual(String(citizenId('c1', 1)), String(citizenId('c2', 1)))
})

test('the same ids come out on every run', () => {
  const a = buildCitizenSeed(NOW)
  const b = buildCitizenSeed(new Date(NOW.getTime() + 86400000))
  assert.deepEqual(a.issues.map((i) => String(i._id)), b.issues.map((i) => String(i._id)))
  assert.deepEqual(a.alerts.map((i) => String(i._id)), b.alerts.map((i) => String(i._id)))
})

test('citizen ids never collide with the admin or department ids', () => {
  const citizen = buildCitizenSeed(NOW)
  const mine = [...citizen.issues, ...citizen.alerts].map((row) => String(row._id))
  const admin = withFixedIds(buildSeed(NOW)).issues.map((i) => String(i._id))
  const department = buildDepartmentIssues().map((i) => String(i._id))
  assert.equal(new Set([...mine, ...admin, ...department]).size, mine.length + admin.length + department.length)
})

test('the reports cover the cases the citizen requests need', () => {
  const { issues } = buildCitizenSeed(NOW)
  const mineOpen = issues.filter((i) => i.reporterEmail === CITIZEN_EMAIL && i.status === 'open')
  assert.equal(mineOpen.length, 2)
  assert.equal(issues.filter((i) => i.reporterEmail === CITIZEN_EMAIL && i.status === 'in-progress').length, 1)
  assert.equal(issues.filter((i) => i.reporterEmail === CITIZEN_EMAIL && i.status === 'resolved').length, 1)
  assert.equal(issues.filter((i) => i.reporterEmail === OTHER_EMAIL).length, 1)
  assert.ok(issues.every((i) => i.division === 'Chattogram'))
})

test('every report has the reporter\'s own vote, and every row passes its model', async () => {
  const seed = buildCitizenSeed(NOW)
  assert.equal(seed.votes.length, seed.issues.length)
  for (const row of seed.issues) await assert.doesNotReject(new Issue(row).validate(), row.title)
  for (const row of seed.votes) await assert.doesNotReject(new Vote(row).validate())
  for (const row of seed.alerts) await assert.doesNotReject(new Alert(row).validate(), row.text)
})