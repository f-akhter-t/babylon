// clip.service with a fake transformers.js, so no model is downloaded.
import test from 'node:test'
import assert from 'node:assert/strict'

process.env.MONGODB_URI = 'mongodb://example.test/db'
process.env.JWT_SECRET = 'a-test-secret-long-enough'

const { createClipService } = await import('../src/shared/service/clip.service.js')

const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

function fakeTransformers({ failLoads = 0 } = {}) {
  const state = { loads: 0, remainingFailures: failLoads }
  const from = (make) => ({
    from_pretrained: async () => {
      state.loads += 1
      if (state.remainingFailures > 0) {
        state.remainingFailures -= 1
        throw new Error('download failed')
      }
      return make()
    },
  })
  return {
    state,
    module: {
      AutoProcessor: from(() => async () => ({ pixel_values: 'x' })),
      CLIPVisionModelWithProjection: from(() => async () => ({ image_embeds: { data: Float32Array.from([3, 4]) } })),
      AutoTokenizer: from(() => (texts) => ({ count: texts.length })),
      CLIPTextModelWithProjection: from(() => async ({ count }) => ({
        text_embeds: { dims: [count, 2], data: Float32Array.from(Array.from({ length: count }, (_, i) => (i === 0 ? [3, 4] : [0, 2])).flat()) },
      })),
      RawImage: { fromBlob: async () => ({ image: true }) },
    },
  }
}

const make = (fake, enabled = true) =>
  createClipService({ enabled: () => enabled, loadTransformers: async () => fake.module })

test('isEnabled follows the flag', () => {
  assert.equal(make(fakeTransformers(), true).isEnabled(), true)
  assert.equal(make(fakeTransformers(), false).isEnabled(), false)
})

test('embedImage gives a list of numbers of length 1', async () => {
  const clip = make(fakeTransformers())
  const embedding = await clip.embedImage(PIXEL)
  assert.deepEqual(embedding, [0.6, 0.8])
})

test('embedTexts gives one length-1 list for each sentence', async () => {
  const clip = make(fakeTransformers())
  const rows = await clip.embedTexts(['one', 'two'])
  assert.deepEqual(rows, [[0.6, 0.8], [0, 1]])
})

test('the model is loaded once, however many photos', async () => {
  const fake = fakeTransformers()
  const clip = make(fake)
  await Promise.all([clip.embedImage(PIXEL), clip.embedImage(PIXEL), clip.embedTexts(['a'])])
  await clip.embedImage(PIXEL)
  assert.equal(fake.state.loads, 4) // the four pieces, once each
})

test('a failed load is forgotten, so the next photo tries again', async () => {
  const fake = fakeTransformers({ failLoads: 4 })
  const clip = make(fake)
  await assert.rejects(clip.embedImage(PIXEL), /download failed/)
  assert.deepEqual(await clip.embedImage(PIXEL), [0.6, 0.8])
})

test('the model cache folder is set before the model loads, when one is given', async () => {
  const fake = fakeTransformers()
  fake.module.env = { cacheDir: '/default' }
  const clip = createClipService({
    enabled: () => true,
    loadTransformers: async () => fake.module,
    cacheDir: '/tmp/hf-cache',
  })
  await clip.embedImage(PIXEL)
  assert.equal(fake.module.env.cacheDir, '/tmp/hf-cache')
})

test('without a cache folder the library keeps its own', async () => {
  const fake = fakeTransformers()
  fake.module.env = { cacheDir: '/default' }
  const clip = createClipService({
    enabled: () => true,
    loadTransformers: async () => fake.module,
    cacheDir: null,
  })
  await clip.embedImage(PIXEL)
  assert.equal(fake.module.env.cacheDir, '/default')
})

test('something that is not an image data URL is refused', async () => {
  const clip = make(fakeTransformers())
  await assert.rejects(clip.embedImage('not a photo'), TypeError)
  await assert.rejects(clip.embedImage('data:text/plain;base64,AAAA'), TypeError)
})
