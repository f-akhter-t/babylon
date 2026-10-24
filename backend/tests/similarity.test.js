import test from 'node:test'
import assert from 'node:assert/strict'
import { cosineSimilarity } from '../src/utils/similarity.js'

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is not ${expected}`)

test('the same list is 1', () => {
  near(cosineSimilarity([1, 2, 3], [1, 2, 3]), 1)
})

test('the same direction at a different size is still 1', () => {
  near(cosineSimilarity([1, 2, 3], [2, 4, 6]), 1)
})

test('lists at a right angle are 0', () => {
  near(cosineSimilarity([1, 0], [0, 1]), 0)
})

test('opposite lists are -1', () => {
  near(cosineSimilarity([1, 2], [-1, -2]), -1)
})

test('worked by hand: [1,1] and [1,0] give 0.7071...', () => {
  near(cosineSimilarity([1, 1], [1, 0]), Math.SQRT1_2)
})

test('a list of zeros gives 0, not NaN', () => {
  assert.equal(cosineSimilarity([0, 0, 0], [1, 2, 3]), 0)
})

test('works with typed arrays', () => {
  near(cosineSimilarity(new Float32Array([3, 4]), new Float32Array([3, 4])), 1)
})

test('lists of different length, or empty, are refused', () => {
  assert.throws(() => cosineSimilarity([1, 2], [1, 2, 3]), TypeError)
  assert.throws(() => cosineSimilarity([], []), TypeError)
})
