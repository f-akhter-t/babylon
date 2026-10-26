import { beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fail, installBrowser, installFetch, ok } from './helpers.js'
import { normalizePhone } from '../src/utils/profileRules.js'

const store = installBrowser()
const net = installFetch()
const api = await import('../src/services/profileApi.js')

beforeEach(() => {
  store.clear()
  net.reset()
})

describe('profile details', () => {
  it('getProfile reads GET /citizen/profile', async () => {
    net.reply(200, ok({ name: 'Nadia', division: 'Dhaka' }))
    assert.deepEqual(await api.getProfile(), { name: 'Nadia', division: 'Dhaka' })
    assert.equal(net.calls[0].url, '/api/citizen/profile')
  })

  it('saveProfile PATCHes the trimmed details, then reloads the profile', async () => {
    net.reply(200, ok({}))
    net.reply(200, ok({ name: 'Nadia', division: 'Chattogram' }))
    const profile = await api.saveProfile({ name: ' Nadia ', address: ' Road 1 ', division: 'Chattogram' })
    assert.deepEqual(net.calls.map((c) => [c.method, c.url]), [
      ['PATCH', '/api/citizen/profile'],
      ['GET', '/api/citizen/profile'],
    ])
    assert.deepEqual(net.calls[0].body, { name: 'Nadia', address: 'Road 1', division: 'Chattogram' })
    assert.equal(profile.division, 'Chattogram')
  })

  it('saveProfile stops on bad details and sends nothing', async () => {
    await assert.rejects(api.saveProfile({ name: '', address: '', division: '' }), {
      message: 'Some details are not valid. Please check the form.',
    })
    assert.equal(net.calls.length, 0)
  })
})

describe('phone code', () => {
  // This test must stay first: no number has been requested yet.
  it('verifyOtp with no earlier request says expired and sends nothing', async () => {
    assert.deepEqual(await api.verifyOtp('123456'), { status: 'expired' })
    assert.equal(net.calls.length, 0)
  })

  it('requestOtp POSTs the cleaned number and returns phone and resendIn', async () => {
    const phone = normalizePhone('01712345678')
    net.reply(200, ok({ phone, resendIn: 30 }))
    assert.deepEqual(await api.requestOtp('01712345678'), { phone, resendIn: 30 })
    assert.equal(net.calls[0].url, '/api/citizen/profile/phone-code')
    assert.deepEqual(net.calls[0].body, { phone })
  })

  it('requestOtp stops on a bad number and sends nothing', async () => {
    await assert.rejects(api.requestOtp('123'), {
      message: 'Please enter a valid mobile number first.',
    })
    assert.equal(net.calls.length, 0)
  })

  it('a wrong code gives status wrong with the server message', async () => {
    net.reply(400, fail('invalid', 'That code is not right. You have 2 tries left.', 'code'))
    assert.deepEqual(await api.verifyOtp('000000'), {
      status: 'wrong',
      message: 'That code is not right. You have 2 tries left.',
    })
  })

  it('the third wrong code (423) gives status locked', async () => {
    net.reply(423, fail('locked', 'Too many wrong codes. Ask for a new code.'))
    assert.deepEqual(await api.verifyOtp('000000'), {
      status: 'locked',
      message: 'Too many wrong codes. Ask for a new code.',
    })
  })

  it('the right code verifies and returns the fresh profile', async () => {
    net.reply(200, ok({}))
    net.reply(200, ok({ phone: '01712345678', phoneVerified: true }))
    const result = await api.verifyOtp('123456')
    assert.equal(result.status, 'verified')
    assert.equal(result.profile.phoneVerified, true)
    assert.deepEqual(net.calls[0].body, { phone: normalizePhone('01712345678'), code: '123456' })
  })
})

describe('identity', () => {
  it('a bad NID number stops before anything is sent', async () => {
    await assert.rejects(api.submitIdentity({ nid: '12', photo: null }), {
      message: 'Please check your NID number and photo.',
    })
    assert.equal(net.calls.length, 0)
  })
})