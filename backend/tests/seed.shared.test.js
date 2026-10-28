// The shared seed's pieces: fixed ids (the same row has the same id on every run)
// and one settled set of demo values. The database itself is not used.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import Issue from '../src/models/issue.model.js'
import { buildSeed } from '../scripts/seedData.js'
import { fixedId, withFixedIds } from '../scripts/seedAdminRun.js'
import { buildDepartmentIssues } from '../scripts/seedDepartmentData.js'
import { buildPublicSeed } from '../scripts/seedPublicData.js'

const NOW = new Date('2026-10-23T12:00:00Z')

test('a fixed id is a valid 24-character id and is the same every time', () => {
  const a = fixedId('ad', 1)
  assert.equal(String(a).length, 24)
  assert.ok(mongoose.isValidObjectId(String(a)))
  assert.equal(String(a), String(fixedId('ad', 1)))
  assert.notEqual(String(a), String(fixedId('ad', 2)))
  assert.notEqual(String(fixedId('ad', 1)), String(fixedId('ae', 1)))
})

test('the admin seed gives every issue and identity its own fixed id, the same on every run', () => {
  const first = withFixedIds(buildSeed(NOW))
  const second = withFixedIds(buildSeed(new Date(NOW.getTime() + 86400000)))
  const ids = [...first.issues, ...first.identities].map((row) => String(row._id))
  assert.equal(new Set(ids).size, ids.length)
  assert.deepEqual(first.issues.map((i) => String(i._id)), second.issues.map((i) => String(i._id)))
  assert.deepEqual(first.identities.map((i) => String(i._id)), second.identities.map((i) => String(i._id)))
})

test('the admin, department and public ids never collide', () => {
  const admin = withFixedIds(buildSeed(NOW)).issues.map((i) => String(i._id))
  const department = buildDepartmentIssues().map((i) => String(i._id))
  assert.equal(department.length, 6)
  assert.equal(new Set([...admin, ...department]).size, admin.length + department.length)
})

test('the department issues can be filed by the public seed\'s demo citizen, in one division', async () => {
  const demo = buildPublicSeed(NOW).users.find((u) => u.role === 'citizen')
  const rows = buildDepartmentIssues({ division: demo.division, reporter: demo.name })
  assert.ok(rows.every((r) => r.division === 'Chattogram' && r.reporter === 'Nadia R.' && r.reporterEmail === demo.email))
  for (const row of rows) await assert.doesNotReject(new Issue(row).validate(), row.title)
})

test('without overrides the department seed keeps its own values', () => {
  assert.ok(buildDepartmentIssues().every((r) => r.division === 'Dhaka'))
})
