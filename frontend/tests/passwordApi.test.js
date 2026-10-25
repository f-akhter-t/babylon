import { beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fail, installBrowser, installFetch, ok } from './helpers.js'

const store = installBrowser()
const net = installFetch()
const http = await import('../src/services/http.js')
const pw = await import('../src/services/passwordApi.js')
const { validateEmail, validateNewAccount, validatePassword } = await import(
  '../src/pages/Auth/validateNewAccount.js'
)

beforeEach(() => {
  store.clear()
  net.reset()
  http.setUnauthorizedHandler(() => {})
})

const last = () => net.calls.at(-1)

describe('asking for a reset code', () => {
  it('posts the trimmed email with no token, even if one is stored', async () => {
    http.setToken('some-token')
    net.reply(200, ok({ resendAfter: 30 }))
    const result = await pw.askForResetCode('  nadia@example.com ')
    assert.deepEqual(result, { resendAfter: 30 })
    assert.equal(last().url, '/api/auth/forgot-password')
    assert.equal(last().method, 'POST')
    assert.deepEqual(last().body, { email: 'nadia@example.com' })
    assert.equal('Authorization' in last().headers, false)
  })

  it('uses the default wait when the server leaves it out or sends nonsense', async () => {
    net.reply(200, ok(null))
    assert.deepEqual(await pw.askForResetCode('a@b.co'), { resendAfter: pw.RESEND_SECONDS })
    net.reply(200, ok({ resendAfter: 'soon' }))
    assert.deepEqual(await pw.askForResetCode('a@b.co'), { resendAfter: pw.RESEND_SECONDS })
    net.reply(200, ok({ resendAfter: 0 }))
    assert.deepEqual(await pw.askForResetCode('a@b.co'), { resendAfter: pw.RESEND_SECONDS })
  })

  it('keeps the server sentence and code for each failure', async () => {
    const cases = [
      [400, 'invalid', 'Enter a valid email address.', 'email'],
      [429, 'too-many-requests', 'Too many requests. Please wait a minute.'],
      [500, 'server-error', 'Email codes are not available right now.'],
      [503, 'email-unavailable', 'We could not send the email. Please try again in a moment.'],
    ]
    for (const [status, code, message, field] of cases) {
      net.reset()
      net.reply(status, fail(code, message, field))
      await assert.rejects(pw.askForResetCode('a@b.co'), (err) => {
        assert.equal(err.message, message)
        assert.equal(err.code, code)
        assert.equal(err.status, status)
        assert.equal(err.field, field)
        return true
      })
    }
  })

  it('reports an unreachable server with the network sentence', async () => {
    net.replyNetworkDown()
    await assert.rejects(pw.askForResetCode('a@b.co'), (err) => {
      assert.equal(err.message, http.NETWORK_MESSAGE)
      assert.equal(err.code, 'network')
      return true
    })
  })
})

describe('resetting the password', () => {
  it('posts the email, the code without spaces and the new password, with no token', async () => {
    http.setToken('some-token')
    net.reply(200, ok(null))
    const result = await pw.resetPassword({
      email: ' nadia@example.com ',
      code: '123 456',
      newPassword: 'fresh-pass',
    })
    assert.equal(result, undefined)
    assert.equal(last().url, '/api/auth/reset-password')
    assert.equal(last().method, 'POST')
    assert.deepEqual(last().body, {
      email: 'nadia@example.com',
      code: '123456',
      newPassword: 'fresh-pass',
    })
    assert.equal('Authorization' in last().headers, false)
  })

  it('does not trim the password', async () => {
    net.reply(200, ok(null))
    await pw.resetPassword({ email: 'a@b.co', code: '123456', newPassword: ' spaced pass ' })
    assert.equal(last().body.newPassword, ' spaced pass ')
  })

  it('a wrong code and a bad password come back with their field', async () => {
    net.reply(400, fail('invalid', 'That code is not right or has expired. Check it, or ask for a new one.', 'code'))
    await assert.rejects(
      pw.resetPassword({ email: 'a@b.co', code: '000000', newPassword: 'fresh-pass' }),
      (err) => err.status === 400 && err.field === 'code' && /not right or has expired/.test(err.message),
    )
    net.reset()
    net.reply(400, fail('invalid', 'Password must be at least 6 characters.', 'new'))
    await assert.rejects(
      pw.resetPassword({ email: 'a@b.co', code: '123456', newPassword: 'abc' }),
      (err) => err.status === 400 && err.field === 'new' && err.message === 'Password must be at least 6 characters.',
    )
  })

  it('a locked code is a 423 with the sentence that says to ask for a new one', async () => {
    net.reply(423, fail('locked', 'Too many wrong codes. Ask for a new code to try again.'))
    await assert.rejects(
      pw.resetPassword({ email: 'a@b.co', code: '111111', newPassword: 'fresh-pass' }),
      (err) => err.status === 423 && err.code === 'locked' && /Ask for a new code/.test(err.message),
    )
  })

  it('too many requests, email codes off and a down server all give a sentence', async () => {
    const replies = [
      [() => net.reply(429, fail('too-many-requests', 'Too many tries. Please wait a minute.')), 'Too many tries. Please wait a minute.'],
      [() => net.reply(500, fail('server-error', 'Email codes are not available right now.')), 'Email codes are not available right now.'],
      [() => net.replyNotJson(502), http.NETWORK_MESSAGE],
      [() => net.reply(500, {}), http.UNKNOWN_MESSAGE],
    ]
    for (const [queue, message] of replies) {
      net.reset()
      queue()
      await assert.rejects(
        pw.resetPassword({ email: 'a@b.co', code: '123456', newPassword: 'fresh-pass' }),
        (err) => err.message === message,
      )
    }
  })
})

describe('reset code checks', () => {
  it('accepts exactly six digits, with or without spaces', () => {
    assert.equal(pw.validateResetCode('123456'), null)
    assert.equal(pw.validateResetCode(' 123 456 '), null)
    assert.equal(pw.validateResetCode('000000'), null)
  })

  it('refuses anything else with the same sentence', () => {
    for (const bad of ['', '   ', '12345', '1234567', 'abcdef', '12a456', '12-456']) {
      assert.equal(pw.validateResetCode(bad), pw.RESET_MESSAGES.codeInvalid, JSON.stringify(bad))
    }
    assert.equal(pw.validateResetCode(undefined), pw.RESET_MESSAGES.codeInvalid)
  })

  it('normalizeResetCode drops every kind of space', () => {
    assert.equal(pw.normalizeResetCode(' 12\t34 \n56 '), '123456')
    assert.equal(pw.normalizeResetCode(null), '')
  })
})

describe('form checks shared with sign-up', () => {
  it('validateEmail returns a sentence or null', () => {
    assert.equal(validateEmail('nadia@example.com'), null)
    assert.equal(validateEmail('  nadia@example.com  '), null)
    for (const bad of ['', 'nadia', 'nadia@', 'nadia@example', 'a b@example.com']) {
      assert.equal(validateEmail(bad), 'Enter a valid email address.', bad)
    }
  })

  it('validateNewAccount still checks the email first, then the password', () => {
    assert.equal(validateNewAccount({ email: 'x', password: 'abcdef', confirm: 'abcdef' }), 'Enter a valid email address.')
    assert.equal(validateNewAccount({ email: 'a@b.co', password: 'abc', confirm: 'abc' }), 'Password must be at least 6 characters.')
    assert.equal(validateNewAccount({ email: 'a@b.co', password: 'abcdef', confirm: 'abcdeg' }), 'The two passwords do not match.')
    assert.equal(validateNewAccount({ email: 'a@b.co', password: 'abcdef', confirm: 'abcdef' }), null)
    assert.equal(validatePassword({ password: ' abcdef ', confirm: ' abcdef ' }), null)
  })
})
