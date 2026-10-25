import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { profileProgress } from '../src/pages/Profile/profileProgress.js'

const profile = (extra = {}) => ({
  name: 'Nadia Rahman', division: 'Chattogram', phoneVerified: false, emailVerified: false,
  identity: { status: 'not-submitted' }, ...extra,
})

describe('profile progress', () => {
  it('has four steps in order: details, phone, email, identity', () => {
    const { steps } = profileProgress(profile())
    assert.deepEqual(steps.map((s) => s.key), ['details', 'phone', 'email', 'identity'])
    assert.deepEqual(steps.map((s) => s.label), ['Details', 'Phone', 'Email', 'Identity'])
  })

  it('the email step is done only once the address is verified', () => {
    assert.equal(profileProgress(profile()).steps[2].state, 'todo')
    assert.equal(profileProgress(profile({ emailVerified: true })).steps[2].state, 'done')
    // A profile from before the email check has no flag at all.
    const { emailVerified, ...old } = profile()
    void emailVerified
    assert.equal(profileProgress(old).steps[2].state, 'todo')
  })

  it('counts the done steps, and identity under review is not done', () => {
    assert.equal(profileProgress(profile()).done, 1)
    assert.equal(profileProgress(profile({ phoneVerified: true, emailVerified: true })).done, 3)
    const pending = profileProgress(profile({ identity: { status: 'pending' } }))
    assert.equal(pending.steps[3].state, 'pending')
    assert.equal(pending.done, 1)
    const all = profileProgress(profile({ phoneVerified: true, emailVerified: true, identity: { status: 'verified' } }))
    assert.equal(all.done, 4)
  })
})
