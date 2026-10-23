import { beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fail, installBrowser, installFetch, ok } from './helpers.js'

const store = installBrowser()
const net = installFetch()
const auth = await import('../src/services/auth.js')
const http = await import('../src/services/http.js')

const nadia = { id: 'u1', name: 'Nadia R.', email: 'citizen@babylon.test', role: 'citizen', department: null, onboarded: true }
const rafiq = { id: 'u2', name: 'Rafiq Hasan', email: 'roads@babylon.test', role: 'department', department: 'Roads & Highways', onboarded: true }
const admin = { id: 'u3', name: 'Tahmina Akter', email: 'admin@babylon.test', role: 'admin', department: null, onboarded: true }
const newcomer = { id: 'u9', name: 'Sara Khan', email: 'sara@example.com', role: 'citizen', department: null, onboarded: true }

const signedIn = (user, token = 'tok-' + user.id) => ({ token, user })

beforeEach(() => {
  store.clear()
  net.reset()
})

describe('login', () => {
  it('posts the form to /auth/login with no token, and returns the session', async () => {
    net.reply(200, ok(signedIn(nadia)))
    const session = await auth.login({ email: 'citizen@babylon.test', password: 'password123', door: 'citizen' })
    assert.equal(net.calls[0].url, '/api/auth/login')
    assert.equal(net.calls[0].method, 'POST')
    assert.deepEqual(net.calls[0].body, { email: 'citizen@babylon.test', password: 'password123', door: 'citizen' })
    assert.equal('Authorization' in net.calls[0].headers, false)
    assert.deepEqual(session, { name: 'Nadia R.', email: 'citizen@babylon.test', role: 'citizen' })
  })

  it('the session has no id, no onboarding flag and no empty department', async () => {
    net.reply(200, ok(signedIn(nadia)))
    const session = await auth.login({ email: nadia.email, password: 'x', door: 'citizen' })
    for (const key of ['id', 'onboarded', 'department', 'password', 'token']) {
      assert.equal(key in session, false, key)
    }
  })

  it('saves the token and the session, and getSession reads them back', async () => {
    net.reply(200, ok(signedIn(nadia, 'the-token')))
    const session = await auth.login({ email: nadia.email, password: 'x', door: 'citizen' })
    assert.equal(http.getToken(), 'the-token')
    assert.deepEqual(auth.getSession(), session)
  })

  it('a department officer keeps the department in the session', async () => {
    net.reply(200, ok(signedIn(rafiq)))
    const session = await auth.login({ email: rafiq.email, password: 'x', door: 'staff' })
    assert.deepEqual(session, { name: 'Rafiq Hasan', email: rafiq.email, role: 'department', department: 'Roads & Highways' })
  })

  it('a wrong door is an error with the server code, and nothing is saved', async () => {
    net.reply(403, fail('staff-account', 'This is a staff account, so please use the staff sign-in page.'))
    await assert.rejects(auth.login({ email: rafiq.email, password: 'x', door: 'citizen' }), (err) => {
      assert.equal(err.code, 'staff-account')
      assert.match(err.message, /staff sign-in page/)
      return true
    })
    assert.equal(http.getToken(), null)
    assert.equal(auth.getSession(), null)
  })

  it('a wrong password is the server sentence, and nothing is saved', async () => {
    net.reply(401, fail('unauthorized', 'That email and password do not match an account.'))
    await assert.rejects(auth.login({ email: nadia.email, password: 'no', door: 'citizen' }), {
      message: 'That email and password do not match an account.',
    })
    assert.equal(auth.getSession(), null)
  })

  it('a failed log-in does not sign out the session that already exists', async () => {
    net.reply(200, ok(signedIn(nadia, 'keep-me')))
    await auth.login({ email: nadia.email, password: 'x', door: 'citizen' })
    net.reset()
    net.reply(401, fail('unauthorized', 'No.'))
    await assert.rejects(auth.login({ email: nadia.email, password: 'wrong', door: 'citizen' }))
    assert.equal(http.getToken(), 'keep-me')
    assert.ok(auth.getSession())
  })

  it('the typed password is never written to the browser', async () => {
    net.reply(200, ok(signedIn(newcomer)))
    await auth.login({ email: newcomer.email, password: 'Sup3r-secret-pw', door: 'citizen' })
    assert.equal(JSON.stringify([...store.entries()]).includes('Sup3r-secret-pw'), false)
  })
})

describe('signup', () => {
  it('posts name, email, password and role, with no token, and signs the person in', async () => {
    net.reply(201, ok(signedIn(newcomer, 'new-token')))
    const session = await auth.signup({ name: 'Sara Khan', email: 'sara@example.com', password: 'secret1', role: 'citizen' })
    assert.equal(net.calls[0].url, '/api/auth/signup')
    assert.deepEqual(net.calls[0].body, { name: 'Sara Khan', email: 'sara@example.com', password: 'secret1', role: 'citizen' })
    assert.equal('Authorization' in net.calls[0].headers, false)
    assert.deepEqual(session, { name: 'Sara Khan', email: 'sara@example.com', role: 'citizen' })
    assert.equal(http.getToken(), 'new-token')
    assert.deepEqual(auth.getSession(), session)
  })

  it('sends only those four fields, never an access code or department', async () => {
    net.reply(403, fail('invalid', 'Staff accounts are not created on this page. Ask your administrator.'))
    await assert.rejects(
      auth.signup({ name: 'Tom', email: 't@x.com', password: 'secret1', role: 'admin', department: 'Roads', accessCode: 'BABYLON-STAFF-2026' }),
    )
    assert.deepEqual(Object.keys(net.calls[0].body).sort(), ['email', 'name', 'password', 'role'])
  })

  it('a taken email keeps the server field and sentence, and signs nobody in', async () => {
    net.reply(409, fail('conflict', 'An account with this email already exists.', 'email'))
    await assert.rejects(auth.signup({ name: 'Sara Khan', email: 'sara@example.com', password: 'secret1', role: 'citizen' }), (err) => {
      assert.equal(err.field, 'email')
      assert.equal(err.message, 'An account with this email already exists.')
      return true
    })
    assert.equal(auth.getSession(), null)
    assert.equal(http.getToken(), null)
  })

  it('a staff sign-up is refused by the server and creates no session', async () => {
    net.reply(400, fail('invalid', 'Staff accounts are not created on this page. Ask your administrator.', 'role'))
    await assert.rejects(auth.signup({ name: 'Tom', email: 't@x.com', password: 'secret1', role: 'department' }), {
      message: 'Staff accounts are not created on this page. Ask your administrator.',
    })
    assert.equal(auth.getSession(), null)
  })
})

describe('the saved accounts the unswapped api.js still reads', () => {
  it('a new citizen can be found by email, and has no password stored', async () => {
    net.reply(201, ok(signedIn(newcomer)))
    await auth.signup({ name: 'Sara Khan', email: 'sara@example.com', password: 'secret1', role: 'citizen' })
    assert.deepEqual(auth.getAccount('sara@example.com'), { name: 'Sara Khan', email: 'sara@example.com', role: 'citizen' })
    assert.equal(auth.getAccountName('SARA@example.com'), 'Sara Khan')
    assert.equal(auth.isOnboarded('sara@example.com'), true)
  })

  it('the three demo accounts are not saved a second time', async () => {
    net.reply(200, ok(signedIn(admin)))
    await auth.login({ email: admin.email, password: 'x', door: 'staff' })
    assert.deepEqual(auth.staffEmails({ role: 'admin' }), ['admin@babylon.test'])
    assert.equal(JSON.parse(store.get('babylon-users') ?? '[]').length, 0)
  })

  it('logging in twice does not duplicate the account', async () => {
    net.reply(200, ok(signedIn(newcomer)))
    await auth.login({ email: newcomer.email, password: 'x', door: 'citizen' })
    await auth.login({ email: newcomer.email, password: 'x', door: 'citizen' })
    assert.equal(JSON.parse(store.get('babylon-users')).length, 1)
  })

  it('a staff account follows the setup flag the server sent', async () => {
    const officer = { id: 'u5', name: 'Imran Ali', email: 'imran@city.gov', role: 'department', department: 'Waste Management', onboarded: false }
    net.reply(200, ok(signedIn(officer)))
    await auth.login({ email: officer.email, password: 'x', door: 'staff' })
    assert.equal(auth.isOnboarded(officer.email), false)
    net.reset()
    net.reply(200, ok(signedIn({ ...officer, onboarded: true })))
    await auth.login({ email: officer.email, password: 'x', door: 'staff' })
    assert.equal(auth.isOnboarded(officer.email), true)
  })

  it('a name changed on the Profile page is kept after the next log-in', async () => {
    net.reply(200, ok(signedIn(newcomer)))
    await auth.login({ email: newcomer.email, password: 'x', door: 'citizen' })
    auth.renameAccount(newcomer.email, 'Sara K.')
    const again = await auth.login({ email: newcomer.email, password: 'x', door: 'citizen' })
    assert.equal(again.name, 'Sara K.')
  })
})

describe('getSession', () => {
  it('a saved account without a token counts as signed out', () => {
    store.set('babylon-session', JSON.stringify({ name: 'Nadia R.', email: nadia.email, role: 'citizen' }))
    assert.equal(auth.getSession(), null)
  })

  it('is null for nobody, and for a damaged saved value', () => {
    assert.equal(auth.getSession(), null)
    http.setToken('t')
    store.set('babylon-session', '{not json')
    assert.equal(auth.getSession(), null)
  })
})

describe('changePassword', () => {
  beforeEach(async () => {
    net.reply(200, ok(signedIn(nadia, 'nadia-token')))
    await auth.login({ email: nadia.email, password: 'password123', door: 'citizen' })
    net.reset()
  })

  it('sends PATCH /auth/password with the token and only the two passwords', async () => {
    net.reply(200, { success: true, message: 'Your password is changed.' })
    const result = await auth.changePassword({ email: nadia.email, currentPassword: 'password123', newPassword: 'brand-new-1' })
    assert.equal(result, undefined)
    assert.equal(net.calls[0].url, '/api/auth/password')
    assert.equal(net.calls[0].method, 'PATCH')
    assert.equal(net.calls[0].headers.Authorization, 'Bearer nadia-token')
    assert.deepEqual(net.calls[0].body, { currentPassword: 'password123', newPassword: 'brand-new-1' })
  })

  it('the person stays signed in, with the same token', async () => {
    net.reply(200, { success: true, message: 'ok' })
    await auth.changePassword({ currentPassword: 'password123', newPassword: 'brand-new-1' })
    assert.equal(http.getToken(), 'nadia-token')
    assert.equal(auth.getSession().email, nadia.email)
  })

  it('a wrong current password keeps field "current"', async () => {
    net.reply(400, fail('invalid', 'Your current password is not correct.', 'current'))
    await assert.rejects(auth.changePassword({ currentPassword: 'no', newPassword: 'brand-new-1' }), (err) => {
      assert.equal(err.field, 'current')
      assert.equal(err.message, 'Your current password is not correct.')
      return true
    })
  })

  it('an unchanged or short new password keeps field "new"', async () => {
    net.reply(400, fail('invalid', 'Your new password must be different from your current password.', 'new'))
    await assert.rejects(auth.changePassword({ currentPassword: 'password123', newPassword: 'password123' }), { field: 'new' })
  })

  it('an expired token signs the person out here as well', async () => {
    net.reply(401, fail('unauthorized', 'Please log in to continue.'))
    await assert.rejects(auth.changePassword({ currentPassword: 'a', newPassword: 'bbbbbb' }), { code: 'unauthorized' })
    assert.equal(http.getToken(), null)
    assert.equal(auth.getSession(), null)
  })

  it('a lost connection is the network sentence and keeps the session', async () => {
    net.replyNetworkDown()
    await assert.rejects(auth.changePassword({ currentPassword: 'a', newPassword: 'bbbbbb' }), { code: 'network' })
    assert.equal(http.getToken(), 'nadia-token')
  })
})

describe('logout', () => {
  beforeEach(async () => {
    net.reply(200, ok(signedIn(nadia, 'nadia-token')))
    await auth.login({ email: nadia.email, password: 'x', door: 'citizen' })
    net.reset()
  })

  it('signs out at once, before the server has answered', () => {
    net.reply(200, { success: true, message: 'You are logged out.' })
    auth.logout()
    assert.equal(auth.getSession(), null)
    assert.equal(http.getToken(), null)
  })

  it('tells the server with the token it just forgot', async () => {
    net.reply(200, { success: true, message: 'You are logged out.' })
    auth.logout()
    await new Promise((resolve) => setTimeout(resolve, 0))
    assert.equal(net.calls.length, 1)
    assert.equal(net.calls[0].url, '/api/auth/logout')
    assert.equal(net.calls[0].method, 'POST')
    assert.equal(net.calls[0].headers.Authorization, 'Bearer nadia-token')
  })

  it('still signs out when the server can not be reached, and nothing is thrown', async () => {
    net.replyNetworkDown()
    auth.logout()
    await new Promise((resolve) => setTimeout(resolve, 0))
    assert.equal(auth.getSession(), null)
    assert.equal(http.getToken(), null)
  })

  it('with nobody signed in it sends nothing', () => {
    auth.logout()
    net.reset()
    auth.logout()
    assert.equal(net.calls.length, 0)
  })
})
