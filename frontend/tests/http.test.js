import { beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fail, installBrowser, installFetch, ok } from './helpers.js'

const store = installBrowser()
const net = installFetch()
const http = await import('../src/services/http.js')

let unauthorized
beforeEach(() => {
  store.clear()
  net.reset()
  unauthorized = 0
  http.setUnauthorizedHandler(() => unauthorized++)
})

describe('http.js', () => {
  it('gives back only the data of a successful reply', async () => {
    net.reply(200, ok({ id: 7, title: 'Pothole' }))
    assert.deepEqual(await http.get('/issues/7'), { id: 7, title: 'Pothole' })
  })

  it('a reply with no data (log-out, change password) gives undefined', async () => {
    net.reply(200, { success: true, message: 'Done.' })
    assert.equal(await http.patch('/auth/password', { a: 1 }), undefined)
  })

  it('calls /api by default and keeps the method and path', async () => {
    net.reply(200, ok(null))
    await http.del('/citizen/reports/5')
    assert.equal(net.calls[0].url, '/api/citizen/reports/5')
    assert.equal(net.calls[0].method, 'DELETE')
  })

  it('sends the stored token as a Bearer header', async () => {
    http.setToken('abc.def.ghi')
    net.reply(200, ok(null))
    await http.get('/auth/me')
    assert.equal(net.calls[0].headers.Authorization, 'Bearer abc.def.ghi')
  })

  it('sends no Authorization header when nobody is signed in', async () => {
    net.reply(200, ok(null))
    await http.get('/home/hero')
    assert.equal('Authorization' in net.calls[0].headers, false)
  })

  it('auth: false never sends the token, even a stored one', async () => {
    http.setToken('stale-token')
    net.reply(200, ok(null))
    await http.post('/auth/login', { a: 1 }, { auth: false })
    assert.equal('Authorization' in net.calls[0].headers, false)
  })

  it('an explicit token wins over the stored one', async () => {
    http.setToken('stored')
    net.reply(200, ok(null))
    await http.post('/auth/logout', undefined, { token: 'explicit' })
    assert.equal(net.calls[0].headers.Authorization, 'Bearer explicit')
  })

  it('a body is sent as JSON; a GET sends no body and no content type', async () => {
    net.reply(200, ok(null))
    net.reply(200, ok(null))
    await http.post('/x', { name: 'Nadia', n: 2 })
    await http.get('/x')
    assert.equal(net.calls[0].headers['Content-Type'], 'application/json')
    assert.deepEqual(net.calls[0].body, { name: 'Nadia', n: 2 })
    assert.equal(net.calls[1].body, undefined)
    assert.equal('Content-Type' in net.calls[1].headers, false)
  })

  it('query values are encoded; blank, null and undefined ones are left out', async () => {
    net.reply(200, ok([]))
    await http.get('/issues', {
      query: { category: 'Roads & Highways', search: '', status: undefined, lat: null, limit: 0 },
    })
    assert.equal(net.calls[0].url, '/api/issues?category=Roads+%26+Highways&limit=0')
  })

  it('a query with nothing in it adds no question mark', async () => {
    net.reply(200, ok([]))
    await http.get('/issues', { query: { search: '', category: undefined } })
    assert.equal(net.calls[0].url, '/api/issues')
  })

  it('a failure becomes an Error with the server message, code, status and field', async () => {
    net.reply(400, fail('invalid', 'Enter a valid email address.', 'email'))
    await assert.rejects(http.post('/auth/signup', {}, { auth: false }), (err) => {
      assert.ok(err instanceof Error)
      assert.equal(err.message, 'Enter a valid email address.')
      assert.equal(err.code, 'invalid')
      assert.equal(err.status, 400)
      assert.equal(err.field, 'email')
      return true
    })
  })

  it('a failure without a field has no field property at all', async () => {
    net.reply(409, fail('conflict', 'Taken.'))
    await assert.rejects(http.post('/x', {}), (err) => {
      assert.equal('field' in err, false)
      assert.equal(err.code, 'conflict')
      return true
    })
  })

  it('a failure that carries no message still reads as a sentence', async () => {
    net.reply(500, { success: false })
    await assert.rejects(http.get('/x'), (err) => {
      assert.equal(err.message, http.UNKNOWN_MESSAGE)
      assert.equal(err.code, 'server-error')
      return true
    })
  })

  it('"success: false" inside a 200 is still a failure', async () => {
    net.reply(200, fail('invalid', 'Nope.'))
    await assert.rejects(http.get('/x'), { message: 'Nope.', code: 'invalid' })
  })

  it('no connection gives the network sentence and code "network"', async () => {
    net.replyNetworkDown()
    await assert.rejects(http.get('/x'), (err) => {
      assert.equal(err.message, http.NETWORK_MESSAGE)
      assert.equal(err.code, 'network')
      return true
    })
  })

  it('a reply that is not JSON (proxy error page) is reported as unreachable', async () => {
    net.replyNotJson(502)
    await assert.rejects(http.get('/x'), (err) => {
      assert.equal(err.message, http.NETWORK_MESSAGE)
      assert.equal(err.code, 'network')
      assert.equal(err.status, 502)
      return true
    })
  })

  it('a 401 on a request that carried the token tells the app the session is over', async () => {
    http.setToken('expired')
    net.reply(401, fail('unauthorized', 'Please log in.'))
    await assert.rejects(http.get('/auth/me'), { code: 'unauthorized' })
    assert.equal(unauthorized, 1)
  })

  it('a 401 with no token, with auth: false, or with an explicit token does not', async () => {
    net.reply(401, fail('unauthorized', 'No.'))
    await assert.rejects(http.get('/auth/me'))
    http.setToken('stale')
    await assert.rejects(http.post('/auth/login', {}, { auth: false }))
    await assert.rejects(http.post('/auth/logout', undefined, { token: 'old' }))
    assert.equal(unauthorized, 0)
  })

  it('other failures (403, 404, 500) do not end the session', async () => {
    http.setToken('good')
    for (const status of [403, 404, 500]) {
      net.reply(status, fail('forbidden', 'No.'))
      await assert.rejects(http.get('/x'))
    }
    assert.equal(unauthorized, 0)
  })

  it('token helpers survive storage that is blocked', () => {
    const real = globalThis.localStorage
    globalThis.localStorage = {
      getItem() { throw new Error('blocked') },
      setItem() { throw new Error('blocked') },
      removeItem() { throw new Error('blocked') },
    }
    try {
      assert.equal(http.getToken(), null)
      http.setToken('x')
      http.clearToken()
    } finally {
      globalThis.localStorage = real
    }
  })
})

describe('download (an authenticated file)', () => {
  const realFetch = globalThis.fetch
  let sent
  const answer = (status, { blob = 'BLOB', json } = {}) => {
    globalThis.fetch = async (url, init = {}) => {
      sent = { url, method: init.method, headers: init.headers ?? {}, body: init.body }
      return {
        ok: status >= 200 && status < 300,
        status,
        blob: async () => blob,
        json: async () => {
          if (json === undefined) throw new SyntaxError('Unexpected token <')
          return json
        },
      }
    }
  }
  beforeEach(() => {
    sent = undefined
  })
  const restore = () => {
    globalThis.fetch = realFetch
  }

  it('GETs the path with the stored token and gives back the file', async () => {
    http.setToken('abc.def.ghi')
    answer(200, { blob: 'THE-PHOTO' })
    assert.equal(await http.download('/admin/identity/i1/photo'), 'THE-PHOTO')
    assert.equal(sent.url, '/api/admin/identity/i1/photo')
    assert.equal(sent.method, 'GET')
    assert.equal(sent.headers.Authorization, 'Bearer abc.def.ghi')
    assert.equal(sent.body, undefined)
    restore()
  })

  it('sends no Authorization header when nobody is signed in, and adds a query', async () => {
    answer(200)
    await http.download('/files', { query: { size: 'small', blank: '' } })
    assert.equal('Authorization' in sent.headers, false)
    assert.equal(sent.url, '/api/files?size=small')
    restore()
  })

  it('an explicit token wins, and auth: false sends none', async () => {
    http.setToken('stored')
    answer(200)
    await http.download('/x', { token: 'explicit' })
    assert.equal(sent.headers.Authorization, 'Bearer explicit')
    await http.download('/x', { auth: false })
    assert.equal('Authorization' in sent.headers, false)
    restore()
  })

  it('a refusal becomes an Error with the server sentence, code and status', async () => {
    http.setToken('t')
    answer(404, { json: fail('not-found', 'We could not find that.') })
    await assert.rejects(http.download('/admin/identity/x/photo'), (e) => {
      assert.equal(e.message, 'We could not find that.')
      assert.equal(e.code, 'not-found')
      assert.equal(e.status, 404)
      return true
    })
    assert.equal(unauthorized, 0)
    restore()
  })

  it('a 401 with a stored token ends the session, like any other request', async () => {
    http.setToken('expired')
    answer(401, { json: fail('unauthorized', 'Please sign in to continue.') })
    await assert.rejects(http.download('/x'), (e) => e.code === 'unauthorized' && e.status === 401)
    assert.equal(unauthorized, 1)
    restore()
  })

  it('a reply that is not ours (a proxy page) and a dead network both read as unreachable', async () => {
    answer(502) // no JSON
    await assert.rejects(http.download('/x'), (e) => e.message === http.NETWORK_MESSAGE && e.code === 'network' && e.status === 502)
    globalThis.fetch = async () => {
      throw new TypeError('Failed to fetch')
    }
    await assert.rejects(http.download('/x'), (e) => e.message === http.NETWORK_MESSAGE && e.code === 'network')
    restore()
  })
})
