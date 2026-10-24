import test from 'node:test'
import assert from 'node:assert/strict'

process.env.MONGODB_URI = 'mongodb://example.test/db'
process.env.JWT_SECRET = 'a-test-secret-long-enough'
process.env.CLIP_ENABLED = 'false'

const { createSeverityService, scoreLevels, priorityForScore } = await import('../src/shared/service/severity.service.js')
const { assessPhoto: defaultAssessPhoto } = await import('../src/shared/service/severity.service.js')
const { CLIP_LIMITS } = await import('../src/constants/limits.js')

const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

// Three sentence embeddings pointing in three directions: medium, high, urgent.
const SENTENCES = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]

const fakeClip = ({ enabled = true, image = [0, 0, 1], fail = false, slow = false } = {}) => ({
  isEnabled: () => enabled,
  embedImage: async () => {
    if (fail) throw new Error('model not loaded')
    if (slow) await new Promise((resolve) => setTimeout(resolve, 200))
    return image
  },
  embedTexts: async () => SENTENCES,
})

test('with CLIP off, assessPhoto answers null ("AI skipped")', async () => {
  const { assessPhoto } = createSeverityService({ clip: fakeClip({ enabled: false }) })
  assert.equal(await assessPhoto(PIXEL), null)
})

test('the real default is off unless CLIP_ENABLED=true, so it answers null', async () => {
  assert.equal(await defaultAssessPhoto(PIXEL), null)
})

test('a photo close to the "dangerous" sentence is urgent, with a score near 1', async () => {
  const { assessPhoto } = createSeverityService({ clip: fakeClip({ image: [0, 0, 1] }) })
  const result = await assessPhoto(PIXEL)
  assert.equal(result.priority, 'urgent')
  assert.ok(result.severityScore > 0.99 && result.severityScore <= 1)
  assert.deepEqual(result.embedding, [0, 0, 1])
})

test('a photo close to the "serious" sentence is high, and "minor" is medium', async () => {
  const high = await createSeverityService({ clip: fakeClip({ image: [0, 1, 0] }) }).assessPhoto(PIXEL)
  assert.equal(high.priority, 'high')
  assert.ok(Math.abs(high.severityScore - 0.5) < 0.01)
  const medium = await createSeverityService({ clip: fakeClip({ image: [1, 0, 0] }) }).assessPhoto(PIXEL)
  assert.equal(medium.priority, 'medium')
  assert.ok(medium.severityScore < 0.01)
})

test('the answer has exactly the fixed contract shape', async () => {
  const result = await createSeverityService({ clip: fakeClip() }).assessPhoto(PIXEL)
  assert.deepEqual(Object.keys(result).sort(), ['embedding', 'priority', 'severityScore'])
  assert.ok(['medium', 'high', 'urgent'].includes(result.priority))
  assert.ok(result.severityScore >= 0 && result.severityScore <= 1)
})

test('any failure gives null and never throws', async () => {
  const { assessPhoto } = createSeverityService({ clip: fakeClip({ fail: true }) })
  assert.equal(await assessPhoto(PIXEL), null)
})

test('a model that takes too long gives null', async () => {
  const { assessPhoto } = createSeverityService({ clip: fakeClip({ slow: true }), timeoutMs: 20 })
  assert.equal(await assessPhoto(PIXEL), null)
})

test('scoreLevels: an even mix lands in between', () => {
  const mix = scoreLevels([1, 1, 0], SENTENCES)
  assert.ok(mix.severityScore > 0.2 && mix.severityScore < 0.3)
})

test('the priority follows the score: medium below 0.25, high to 0.55, urgent from 0.55', () => {
  // The scores measured with the real small model on the sample photos.
  assert.equal(priorityForScore(0.12), 'medium') // faded zebra crossing
  assert.equal(priorityForScore(0.2), 'medium') // streetlight
  assert.equal(priorityForScore(0.289), 'high') // sinkhole
  assert.equal(priorityForScore(0.435), 'high') // pothole
  assert.equal(priorityForScore(0.571), 'urgent') // cracked railing
  assert.equal(priorityForScore(0), 'medium')
  assert.equal(priorityForScore(1), 'urgent')
})

test('the three levels run from medium to urgent, weights 0 to 1', () => {
  assert.deepEqual(CLIP_LIMITS.levels.map((l) => l.priority), ['medium', 'high', 'urgent'])
  assert.deepEqual(CLIP_LIMITS.levels.map((l) => l.weight), [0, 0.5, 1])
})
