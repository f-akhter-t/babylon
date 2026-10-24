// F1 screens: the issue JSON says when CLIP scored the photo.
import { test } from 'node:test'
import assert from 'node:assert/strict'

process.env.JWT_SECRET = 'test-secret-not-real'
process.env.MONGODB_URI = 'mongodb://localhost/none'
const { toIssueJSON } = await import('../src/utils/issueView.js')

const doc = { _id: 'a1', title: 'Pothole', category: 'Roads', status: 'open', priority: 'urgent', verification: 'none' }

test('aiAssessed is true only when the issue has a severityScore', () => {
  assert.equal(toIssueJSON({ ...doc, severityScore: 0.8 }).aiAssessed, true)
  assert.equal(toIssueJSON({ ...doc, severityScore: 0 }).aiAssessed, true)
  assert.equal(toIssueJSON(doc).aiAssessed, undefined)
  assert.equal('aiAssessed' in JSON.parse(JSON.stringify(toIssueJSON(doc))), false)
})
