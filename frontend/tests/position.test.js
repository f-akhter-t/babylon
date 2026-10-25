import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { hasPosition } from '../src/utils/position.js'

describe('hasPosition', () => {
  it('is true only when both coordinates are numbers', () => {
    assert.equal(hasPosition({ lat: 22.35, lng: 91.82 }), true)
    assert.equal(hasPosition({ lat: 0, lng: 0 }), true)
    assert.equal(hasPosition({ lat: 22.35 }), false)
    assert.equal(hasPosition({ lat: null, lng: null }), false)
    assert.equal(hasPosition({ lat: '22.35', lng: '91.82' }), false)
    assert.equal(hasPosition({ lat: NaN, lng: 91.82 }), false)
    assert.equal(hasPosition({}), false)
    assert.equal(hasPosition(null), false)
    assert.equal(hasPosition(undefined), false)
  })
})
