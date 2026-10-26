// F2 duplicate check: the logic only. CLIP, the database and the user lookup are replaced.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createDuplicatesService } from '../src/citizen/service/duplicates.service.js'
import { DUPLICATE_LIMITS } from '../src/constants/limits.js'

const issue = (id, imageEmbedding, extra = {}) => ({
  _id: id, title: `Issue ${id}`, category: 'Roads', status: 'open', location: 'Here', imageEmbedding, ...extra,
})

const build = ({ assess, issues = [], division = 'Chattogram' } = {}) => {
  const seen = { find: 0 }
  const service = createDuplicatesService({
    assess,
    divisionOf: async () => division,
    find: async () => { seen.find += 1; return issues },
    photosOf: async (ids) => ids.map((id) => ({ _id: id, beforeImg: `/images/${id}.jpg` })),
  })
  return { service, seen }
}
const input = { email: 'a@babylon.test', photoUrl: 'data:image/jpeg;base64,AAAA' }

test('no division: nothing is checked', async () => {
  const { service, seen } = build({ assess: async () => ({ embedding: [1, 0] }), division: '' })
  assert.deepEqual(await service.check(input), { checked: false, matches: [] })
  assert.equal(seen.find, 0)
})

test('CLIP off (assess returns null): empty list, database not asked', async () => {
  const { service, seen } = build({ assess: async () => null })
  assert.deepEqual(await service.check(input), { checked: false, matches: [] })
  assert.equal(seen.find, 0)
})

test('assess throws: empty list, no error', async () => {
  const { service } = build({ assess: async () => { throw new Error('boom') } })
  assert.deepEqual(await service.check(input), { checked: false, matches: [] })
})

test('a close photo matches; an unrelated one does not', async () => {
  const { service } = build({
    assess: async () => ({ embedding: [1, 0] }),
    issues: [issue('a', [1, 0]), issue('b', [0, 1])],
  })
  const result = await service.check(input)
  assert.equal(result.checked, true)
  assert.deepEqual(result.matches.map((m) => m.id), ['a'])
  assert.equal(result.matches[0].beforeImg, '/images/a.jpg')
})

test('the embedding never leaves the service', async () => {
  const { service } = build({ assess: async () => ({ embedding: [1, 0] }), issues: [issue('a', [1, 0])] })
  const result = await service.check(input)
  assert.equal(JSON.stringify(result).includes('imageEmbedding'), false)
})

test('best match first, and no more than maxMatches', async () => {
  const many = Array.from({ length: DUPLICATE_LIMITS.maxMatches + 2 }, (_, i) => issue(`i${i}`, [1, i * 0.01]))
  const { service } = build({ assess: async () => ({ embedding: [1, 0] }), issues: many })
  const { matches } = await service.check(input)
  assert.equal(matches.length, DUPLICATE_LIMITS.maxMatches)
  assert.deepEqual(matches.map((m) => m.similarity), [...matches.map((m) => m.similarity)].sort((x, y) => y - x))
})

test('a stored vector of the wrong length is skipped', async () => {
  const { service } = build({
    assess: async () => ({ embedding: [1, 0] }),
    issues: [issue('bad', [1, 0, 0]), issue('ok', [1, 0])],
  })
  assert.deepEqual((await service.check(input)).matches.map((m) => m.id), ['ok'])
})