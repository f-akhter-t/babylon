import { beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fail, installBrowser, installFetch, ok } from './helpers.js'

const store = installBrowser()
const net = installFetch()
const http = await import('../src/services/http.js')
const email = await import('../src/services/emailCheckApi.js')

const citizenProfile = {
  name: 'Nadia Rahman', email: 'nadia@babylon.test', role: 'citizen', phoneVerified: false, emailVerified: true,
}

beforeEach(() => {
  store.clear()
  net.reset()
  http.setToken('citizen-token')
})

const last = () => net.calls.at(-1)
const CITIZEN = email.CITIZEN_EMAIL_PATH

describe('citizen email check', () => {
  it('the citizen path is /citizen/profile, the staff path is /auth/staff', () => {
    assert.equal(email.CITIZEN_EMAIL_PATH, '/citizen/profile')
    assert.equal(email.STAFF_EMAIL_PATH, '/auth/staff')
  })

  it('sendEmailCode posts with the token and no body, and gives the address and the wait', async () => {
    net.reply(200, ok({ email: 'nadia@babylon.test', resendAfter: 30 }))
    assert.deepEqual(await email.sendEmailCode(CITIZEN), {
      status: 'sent',
      email: 'nadia@babylon.test',
      resendIn: 30,
    })
    assert.equal(last().url, '/api/citizen/profile/email-code')
    assert.equal(last().method, 'POST')
    assert.equal(last().body, undefined)
    assert.equal(last().headers.Authorization, 'Bearer citizen-token')
  })

  it('an address that is already verified (409) is "verified", not an error', async () => {
    net.reply(409, fail('conflict', 'Your email address is already verified.'))
    assert.deepEqual(await email.sendEmailCode(CITIZEN), { status: 'verified' })
  })

  it('too soon, email codes off, a mail server that says no and no connection keep their sentence', async () => {
    const cases = [
      [429, fail('too-many-requests', 'Please wait 12 seconds before asking for a new code.', 'email')],
      [500, fail('server-error', 'Email codes are not available right now.')],
      [503, fail('email-unavailable', 'We could not send the email. Please try again in a moment.')],
    ]
    for (const [status, body] of cases) {
      net.reset()
      net.reply(status, body)
      await assert.rejects(email.sendEmailCode(CITIZEN), (err) => err.message === body.message && err.status === status)
    }
    net.reset()
    net.replyNetworkDown()
    await assert.rejects(email.sendEmailCode(CITIZEN), (err) => err.code === 'network')
  })

  it('a department token (403) and a signed-out token (401) are thrown, not hidden as a status', async () => {
    net.reply(403, fail('forbidden', 'You do not have access to that.'))
    await assert.rejects(email.sendEmailCode(CITIZEN), (err) => err.status === 403)
    net.reset()
    net.reply(401, fail('unauthorized', 'Please log in.'))
    await assert.rejects(email.verifyEmailCode(CITIZEN, '123456'), (err) => err.status === 401)
  })

  it('verifyEmailCode posts only the code, and the right one is "verified" with the profile', async () => {
    net.reply(200, ok(citizenProfile))
    const result = await email.verifyEmailCode(CITIZEN, '123456')
    assert.equal(result.status, 'verified')
    assert.equal(result.profile.emailVerified, true)
    assert.equal(last().url, '/api/citizen/profile/email-verify')
    assert.deepEqual(last().body, { code: '123456' })
  })

  it('a wrong code and a code that is not 6 digits are "wrong", with the server sentence', async () => {
    const message = 'That code is not right or has expired. Check it, or ask for a new one.'
    net.reply(400, fail('invalid', message, 'code'))
    assert.deepEqual(await email.verifyEmailCode(CITIZEN, '000000'), { status: 'wrong', message })
    net.reset()
    net.reply(400, fail('invalid', 'Enter the 6-digit code.', 'code'))
    assert.deepEqual(await email.verifyEmailCode(CITIZEN, 'abc'), { status: 'wrong', message: 'Enter the 6-digit code.' })
  })

  it('too many wrong codes is "locked", with the server sentence', async () => {
    const message = 'Too many wrong codes. Ask for a new code to try again.'
    net.reply(423, fail('locked', message))
    assert.deepEqual(await email.verifyEmailCode(CITIZEN, '000000'), { status: 'locked', message })
  })

  it('no connection and a server error are thrown', async () => {
    net.replyNetworkDown()
    await assert.rejects(email.verifyEmailCode(CITIZEN, '123456'), (err) => err.code === 'network')
    net.reset()
    net.reply(500, fail('server-error', 'Something went wrong. Please try again.'))
    await assert.rejects(email.verifyEmailCode(CITIZEN, '123456'), (err) => err.status === 500)
  })
})
