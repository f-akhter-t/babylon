// The EmailCode model's rules, checked without a database.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'

process.env.MONGODB_URI = 'mongodb://localhost/unused'
process.env.JWT_SECRET = 'test-secret-test-secret'

const { default: EmailCode } = await import('../src/models/emailCode.model.js')

const valid = () => ({
  userId: new mongoose.Types.ObjectId(),
  purpose: 'reset',
  email: 'Someone@Example.com ',
  codeHash: 'abc',
  lastSentAt: new Date(),
  expiresAt: new Date(Date.now() + 60_000),
})

test('a complete code row is valid; the email is lower-cased and trimmed, tries start at zero', () => {
  const doc = new EmailCode(valid())
  assert.equal(doc.validateSync(), undefined)
  assert.equal(doc.email, 'someone@example.com')
  assert.equal(doc.attempts, 0)
})

test('every field except attempts is required, and the purpose must be a known one', () => {
  for (const field of ['userId', 'purpose', 'email', 'codeHash', 'lastSentAt', 'expiresAt']) {
    const row = valid()
    delete row[field]
    assert.ok(new EmailCode(row).validateSync()?.errors[field], `${field} should be required`)
  }
  assert.ok(new EmailCode({ ...valid(), purpose: 'login' }).validateSync()?.errors.purpose)
  assert.equal(new EmailCode({ ...valid(), purpose: 'verify' }).validateSync(), undefined)
})

test('one active code per account and purpose, and rows expire by themselves', () => {
  const indexes = EmailCode.schema.indexes()
  const unique = indexes.find(([keys]) => keys.userId === 1 && keys.purpose === 1)
  assert.equal(unique?.[1].unique, true)
  const ttl = indexes.find(([keys]) => keys.expiresAt === 1)
  assert.equal(ttl?.[1].expireAfterSeconds, 0)
})
