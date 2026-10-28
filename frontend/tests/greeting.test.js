import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { dayPart, nationalDay } from '../src/utils/greeting.js'

describe('greeting', () => {
  it('picks the part of the day', () => {
    assert.equal(dayPart(new Date(2026, 0, 5, 8)), 'morning')
    assert.equal(dayPart(new Date(2026, 0, 5, 13)), 'noon')
    assert.equal(dayPart(new Date(2026, 0, 5, 16)), 'afternoon')
    assert.equal(dayPart(new Date(2026, 0, 5, 21)), 'evening')
    assert.equal(dayPart(new Date(2026, 0, 5, 2)), 'evening')
  })
  it('knows the national days', () => {
    for (const [m, d] of [[1, 21], [2, 26], [3, 14], [11, 16]]) {
      assert.ok(nationalDay(new Date(2026, m, d)))
    }
    assert.equal(nationalDay(new Date(2026, 9, 28)), null)
  })
})
