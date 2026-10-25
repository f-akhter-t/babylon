// G1, the model pull request: the new fields exist, so Mongoose no longer drops
// them silently, and the hidden vector never leaves in a public answer.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'

process.env.JWT_SECRET = 'test-secret-not-real'
process.env.MONGODB_URI = 'mongodb://localhost/none'

const { default: Issue } = await import('../src/models/issue.model.js')
const { default: User } = await import('../src/models/user.model.js')
const { ALERT_KINDS } = await import('../src/models/alert.model.js')
const { PUBLIC_FIELDS } = await import('../src/shared/service/issues.service.js')

test('an issue keeps severityScore, imageEmbedding and reopenedOf', () => {
  const earlier = new mongoose.Types.ObjectId()
  const issue = new Issue({
    title: 'Pothole', category: 'Roads', severityScore: 0.62, imageEmbedding: [0.1, 0.2, 0.3], reopenedOf: earlier,
  })
  assert.equal(issue.validateSync(), undefined)
  const plain = issue.toObject()
  assert.equal(plain.severityScore, 0.62)
  assert.deepEqual([...plain.imageEmbedding], [0.1, 0.2, 0.3])
  assert.equal(String(plain.reopenedOf), String(earlier))
})

test('imageEmbedding is hidden from queries unless a service asks for it', () => {
  assert.equal(Issue.schema.path('imageEmbedding').options.select, false)
  assert.match(PUBLIC_FIELDS, /-imageEmbedding/)
  assert.match(PUBLIC_FIELDS, /-pendingAfterImg/)
  assert.match(PUBLIC_FIELDS, /-departmentNote/)
})

test('the alert kinds include reopen, next to the old ones', () => {
  assert.ok(ALERT_KINDS.includes('reopen'))
  for (const kind of ['filed', 'resolved', 'identity-rejected']) assert.ok(ALERT_KINDS.includes(kind))
})

test('a user keeps departmentVerified and photo; both start empty', () => {
  const blank = new User({ email: 'a@b.test', name: 'Aa', passwordHash: 'x' })
  assert.equal(blank.departmentVerified, false)
  assert.equal(blank.photo, '')
  const staff = new User({
    email: 'c@d.test', name: 'Cc', passwordHash: 'x', role: 'department', departmentVerified: true, photo: 'data:image/webp;base64,AA==',
  })
  assert.equal(staff.validateSync(), undefined)
  assert.equal(staff.toObject().departmentVerified, true)
  assert.equal(staff.toObject().photo, 'data:image/webp;base64,AA==')
})

test('one Employee ID, one account: a partial unique index that ignores empty IDs', () => {
  const index = User.schema.indexes().find(([fields]) => 'employeeId' in fields)
  assert.ok(index, 'there is an index on employeeId')
  assert.equal(index[1].unique, true)
  assert.deepEqual(index[1].partialFilterExpression, { employeeId: { $gt: '' } })
})
