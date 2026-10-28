import { beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fail, installBrowser, installFetch, ok } from './helpers.js'

const store = installBrowser()
const net = installFetch()
const http = await import('../src/services/http.js')
const staff = await import('../src/services/staffApi.js')

const profile = {
  id: 'u1', name: 'Imran Ali', email: 'imran@city.gov', role: 'department', department: 'Waste Management',
  onboarded: false, jobTitle: '', phone: '', phoneVerified: false, employeeId: '', employeeIdVerified: false,
  departmentVerified: false, photo: '', setupMissing: ['a job title'],
}

beforeEach(() => {
  store.clear()
  net.reset()
  http.setToken('staff-token')
})

const last = () => net.calls.at(-1)

describe('staff profile', () => {
  it('getStaffProfile reads GET /auth/me with the token', async () => {
    net.reply(200, ok(profile))
    assert.deepEqual(await staff.getStaffProfile(), profile)
    assert.equal(last().url, '/api/auth/me')
    assert.equal(last().method, 'GET')
    assert.equal(last().headers.Authorization, 'Bearer staff-token')
  })

  it('saveStaffDetails patches only the name and job title', async () => {
    net.reply(200, ok(profile))
    await staff.saveStaffDetails({ name: 'Imran Ali', jobTitle: 'Clerk', employeeId: 'E-1', onboarded: true })
    assert.equal(last().url, '/api/auth/staff/details')
    assert.equal(last().method, 'PATCH')
    assert.deepEqual(last().body, { name: 'Imran Ali', jobTitle: 'Clerk' })
  })

  it('verifyDepartmentCode posts the code', async () => {
    net.reply(200, ok({ ...profile, departmentVerified: true }))
    assert.equal((await staff.verifyDepartmentCode('WM-1')).departmentVerified, true)
    assert.equal(last().url, '/api/auth/staff/verify-code')
    assert.deepEqual(last().body, { code: 'WM-1' })
  })

  it('a wrong code keeps the server sentence and the field', async () => {
    net.reply(400, fail('invalid', 'That code does not match the Waste Management department.', 'code'))
    await assert.rejects(staff.verifyDepartmentCode('x'), (e) => e.field === 'code' && /Waste Management/.test(e.message))
  })

  it('verifyEmployeeId posts the ID; a taken ID is a conflict error', async () => {
    net.reply(200, ok({ ...profile, employeeId: 'E-TEST-0001', employeeIdVerified: true }))
    assert.equal((await staff.verifyEmployeeId('e-test-0001')).employeeId, 'E-TEST-0001')
    assert.equal(last().url, '/api/auth/staff/verify-employee')
    assert.deepEqual(last().body, { employeeId: 'e-test-0001' })
    net.reset()
    net.reply(409, fail('conflict', 'That Employee ID is already linked to another account.', 'employeeId'))
    await assert.rejects(staff.verifyEmployeeId('E-TEST-0002'), (e) => e.status === 409 && e.code === 'conflict')
  })

  it('saveStaffPhoto posts the data URL, and an empty string removes the photo', async () => {
    net.reply(200, ok({ ...profile, photo: 'data:image/webp;base64,AA==' }))
    await staff.saveStaffPhoto('data:image/webp;base64,AA==')
    assert.equal(last().url, '/api/auth/staff/photo')
    assert.deepEqual(last().body, { photo: 'data:image/webp;base64,AA==' })
    await staff.saveStaffPhoto('')
    assert.deepEqual(last().body, { photo: '' })
  })
})

describe('staff phone code', () => {
  it('sendPhoneCode gives the number and the wait the phone card already understands', async () => {
    net.reply(200, ok({ phone: '01711000111', resendAfter: 30 }))
    assert.deepEqual(await staff.sendPhoneCode('01711000111'), { phone: '01711000111', resendIn: 30 })
    assert.equal(last().url, '/api/auth/staff/phone-code')
    assert.deepEqual(last().body, { phone: '01711000111' })
  })

  it('asking too soon is the server sentence', async () => {
    net.reply(429, fail('too-many-requests', 'Please wait 20 seconds before asking for a new code.', 'phone'))
    await assert.rejects(staff.sendPhoneCode('01711000111'), (e) => e.status === 429 && /wait 20 seconds/.test(e.message))
  })

  it('the right code is "verified" with the new profile', async () => {
    net.reply(200, ok({ ...profile, phone: '01711000111', phoneVerified: true }))
    const result = await staff.verifyPhoneCode('01711000111', '123456')
    assert.equal(result.status, 'verified')
    assert.equal(result.profile.phoneVerified, true)
    assert.equal(last().url, '/api/auth/staff/phone-verify')
    assert.deepEqual(last().body, { phone: '01711000111', code: '123456' })
  })

  it('a wrong code counts down, from the server sentence', async () => {
    net.reply(400, fail('invalid', 'That code is not right. You have 2 tries left.', 'code'))
    assert.deepEqual(await staff.verifyPhoneCode('01711000111', '000000'), { status: 'wrong', attemptsLeft: 2 })
    net.reset()
    net.reply(400, fail('invalid', 'That code is not right. You have 1 try left.', 'code'))
    assert.deepEqual(await staff.verifyPhoneCode('01711000111', '000000'), { status: 'wrong', attemptsLeft: 1 })
  })

  it('too many wrong codes is "locked"; an old or missing code is "expired"', async () => {
    net.reply(423, fail('locked', 'Too many wrong codes. Ask for a new code to try again.'))
    assert.deepEqual(await staff.verifyPhoneCode('01711000111', '1'), { status: 'locked' })
    net.reset()
    net.reply(400, fail('invalid', 'This code has expired. Ask for a new code.', 'code'))
    assert.deepEqual(await staff.verifyPhoneCode('01711000111', '1'), { status: 'expired' })
  })

  it('anything else (no connection, a signed-out token) is thrown, not hidden as a status', async () => {
    net.replyNetworkDown()
    await assert.rejects(staff.verifyPhoneCode('01711000111', '1'), { code: 'network' })
    net.reset()
    net.reply(500, fail('server-error', 'Something went wrong on our side. Please try again.'))
    await assert.rejects(staff.verifyPhoneCode('01711000111', '1'), { code: 'server-error' })
  })
})

describe('staff email code', () => {
  it('sendEmailCode posts with the token and no body, and gives the address and the wait', async () => {
    net.reply(200, ok({ email: 'imran@city.gov', resendAfter: 30 }))
    assert.deepEqual(await staff.sendEmailCode(), {
      status: 'sent',
      email: 'imran@city.gov',
      resendIn: 30,
    })
    assert.equal(last().url, '/api/auth/staff/email-code')
    assert.equal(last().method, 'POST')
    assert.equal(last().body, undefined)
    assert.equal(last().headers.Authorization, 'Bearer staff-token')
  })

  it('an address that is already verified (409) is "verified", not an error', async () => {
    net.reply(409, fail('conflict', 'Your email address is already verified.'))
    assert.deepEqual(await staff.sendEmailCode(), { status: 'verified' })
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
      await assert.rejects(staff.sendEmailCode(), (err) => err.message === body.message && err.status === status)
    }
    net.reset()
    net.replyNetworkDown()
    await assert.rejects(staff.sendEmailCode(), (err) => err.code === 'network')
  })

  it('a citizen token or a signed-out token is thrown, not hidden as a status', async () => {
    net.reply(403, fail('forbidden', 'Only staff accounts can do that.'))
    await assert.rejects(staff.sendEmailCode(), (err) => err.status === 403)
    net.reset()
    net.reply(401, fail('unauthorized', 'Please log in.'))
    await assert.rejects(staff.verifyEmailCode('123456'), (err) => err.status === 401)
  })

  it('verifyEmailCode posts only the code, and the right one is "verified" with the new profile', async () => {
    net.reply(200, ok({ ...profile, emailVerified: true, setupMissing: [] }))
    const result = await staff.verifyEmailCode('123456')
    assert.equal(result.status, 'verified')
    assert.equal(result.profile.emailVerified, true)
    assert.equal(last().url, '/api/auth/staff/email-verify')
    assert.deepEqual(last().body, { code: '123456' })
  })

  it('a wrong or expired code is "wrong", with the server sentence', async () => {
    const message = 'That code is not right or has expired. Check it, or ask for a new one.'
    net.reply(400, fail('invalid', message, 'code'))
    assert.deepEqual(await staff.verifyEmailCode('000000'), { status: 'wrong', message })
  })

  it('too many wrong codes is "locked", with the server sentence', async () => {
    const message = 'Too many wrong codes. Ask for a new code to try again.'
    net.reply(423, fail('locked', message))
    assert.deepEqual(await staff.verifyEmailCode('000000'), { status: 'locked', message })
  })

  it('no connection and a server error are thrown', async () => {
    net.replyNetworkDown()
    await assert.rejects(staff.verifyEmailCode('123456'), (err) => err.code === 'network')
    net.reset()
    net.reply(500, fail('server-error', 'Something went wrong. Please try again.'))
    await assert.rejects(staff.verifyEmailCode('123456'), (err) => err.status === 500)
  })
})

describe('finishing the setup', () => {
  it('finishSetup posts to /auth/staff/finish and gives back the new token and the profile', async () => {
    net.reply(200, ok({ token: 'new-token', user: { ...profile, onboarded: true, setupMissing: [] } }))
    const done = await staff.finishSetup()
    assert.equal(last().url, '/api/auth/staff/finish')
    assert.equal(last().method, 'POST')
    assert.equal(last().headers.Authorization, 'Bearer staff-token')
    assert.equal(done.token, 'new-token')
    assert.equal(done.user.onboarded, true)
  })

  it('finishing too early is the server sentence', async () => {
    net.reply(409, fail('conflict', 'Your profile is not complete yet. Please finish every step first.'))
    await assert.rejects(staff.finishSetup(), (e) => e.status === 409 && /not complete yet/.test(e.message))
  })
})
