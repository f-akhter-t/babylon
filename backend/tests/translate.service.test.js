// The translate service with a fake Gemini, and the rate limiter on its own.
import { test } from 'node:test'
import assert from 'node:assert/strict'

process.env.JWT_SECRET = 'test-secret-not-real'
process.env.MONGODB_URI = 'mongodb://localhost/none'

const { createTranslateService, buildRequest } = await import('../src/admin/service/translate.service.js')
const { rateLimit } = await import('../src/middlewares/rateLimit.js')

test('the instructions go in system, the report text alone in prompt', () => {
  const request = buildRequest('Deep pothole', 'bn')
  assert.match(request.system, /Bangla/)
  assert.equal(request.prompt, 'Deep pothole')
  assert.doesNotMatch(request.system, /pothole/)
})

test('returns the trimmed reply and calls generateText with one object', async () => {
  let seen
  const svc = createTranslateService({
    getGemini: async () => ({ generateText: async (arg) => { seen = arg; return '  গভীর গর্ত \n' } }),
  })
  assert.deepEqual(await svc.translate('Deep pothole', 'bn'), { translation: 'গভীর গর্ত', to: 'bn' })
  assert.equal(seen.prompt, 'Deep pothole')
  assert.equal(typeof seen.system, 'string')
})

test('a missing service, a failure or an empty reply all become ai-unavailable 503', async () => {
  const cases = [
    async () => null,
    async () => { throw new Error('boom') },
    async () => ({ generateText: async () => { throw new Error('quota') } }),
    async () => ({ generateText: async () => '   ' }),
    async () => ({ generateText: async () => 42 }),
  ]
  for (const getGemini of cases) {
    await assert.rejects(createTranslateService({ getGemini }).translate('Hi', 'en'), (e) => e.code === 'ai-unavailable' && e.status === 503)
  }
})

test('rateLimit lets max through, blocks the next, and frees up after the window', () => {
  let t = 0
  const limit = rateLimit({ windowMs: 1000, max: 2, message: 'slow down', now: () => t })
  limit({ user: { email: 'a' } }, {}, () => {})
  limit({ user: { email: 'a' } }, {}, () => {})
  assert.throws(() => limit({ user: { email: 'a' } }, {}, () => {}), (e) => e.status === 429 && e.code === 'too-many-requests')
  assert.doesNotThrow(() => limit({ user: { email: 'b' } }, {}, () => {}))
  t = 1500
  assert.doesNotThrow(() => limit({ user: { email: 'a' } }, {}, () => {}))
})
