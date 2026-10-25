import { beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fail, installBrowser, installFetch, ok } from './helpers.js'

const store = installBrowser()
const net = installFetch()
const http = await import('../src/services/http.js')

// A fresh copy of the module each time, so the hero answer kept from one test
// is not seen by the next.
let count = 0
const load = () => import(`../src/services/publicApi.js?copy=${++count}`)

const hero = {
  slides: [{ id: 'city', headline: ['Our city.'] }, { id: 'flood' }],
  categories: ['Roads', 'Waste'],
}

beforeEach(() => {
  store.clear()
  net.reset()
})

describe('hero', () => {
  it('slides and categories come from GET /home/hero', async () => {
    const api = await load()
    net.reply(200, ok(hero))
    assert.deepEqual(await api.getHeroSlides(), hero.slides)
    assert.equal(net.calls[0].url, '/api/home/hero')
    assert.equal(net.calls[0].method, 'GET')
  })

  it('asking for both lists sends one request, not two', async () => {
    const api = await load()
    net.reply(200, ok(hero))
    const [slides, categories] = await Promise.all([api.getHeroSlides(), api.getHeroCategories()])
    assert.deepEqual(slides, hero.slides)
    assert.deepEqual(categories, hero.categories)
    assert.equal(net.calls.length, 1)
  })

  it('later calls reuse the answer', async () => {
    const api = await load()
    net.reply(200, ok(hero))
    await api.getHeroSlides()
    await api.getHeroCategories()
    await api.getHeroSlides()
    assert.equal(net.calls.length, 1)
  })

  it('a failed request is not kept: the next call asks the server again', async () => {
    const api = await load()
    net.reply(500, fail('server-error', 'Something went wrong.'))
    await assert.rejects(api.getHeroSlides(), { code: 'server-error' })
    net.reset()
    net.reply(200, ok(hero))
    assert.deepEqual(await api.getHeroCategories(), hero.categories)
    assert.equal(net.calls.length, 1)
  })

  it('both calls fail together when the one request fails', async () => {
    const api = await load()
    net.replyNetworkDown()
    const results = await Promise.allSettled([api.getHeroSlides(), api.getHeroCategories()])
    assert.deepEqual(results.map((r) => r.status), ['rejected', 'rejected'])
    assert.equal(net.calls.length, 1)
  })
})

describe('the other Home calls', () => {
  it('getFixedThisWeek: GET /home/fixed-this-week gives the list as sent', async () => {
    const api = await load()
    const issues = [{ id: 'a', title: 'Pothole', beforeImg: 'b', afterImg: 'a' }]
    net.reply(200, ok(issues))
    assert.deepEqual(await api.getFixedThisWeek(), issues)
    assert.equal(net.calls[0].url, '/api/home/fixed-this-week')
  })

  it('getRecentActivity: asks for 8 by default', async () => {
    const api = await load()
    net.reply(200, ok([]))
    await api.getRecentActivity()
    assert.equal(net.calls[0].url, '/api/home/activity?limit=8')
  })

  it('getRecentActivity: passes the limit it is given', async () => {
    const api = await load()
    net.reply(200, ok([{ id: '1', title: 'x', status: 'open', time: 'Just now' }]))
    const items = await api.getRecentActivity(3)
    assert.equal(net.calls[0].url, '/api/home/activity?limit=3')
    assert.equal(items.length, 1)
  })

  it('getStats: GET /home/stats gives the four figures as sent', async () => {
    const api = await load()
    const stats = { received: 12, resolved: 4, avgDays: 3.5, reopenedPercent: 25 }
    net.reply(200, ok(stats))
    assert.deepEqual(await api.getStats(), stats)
    assert.equal(net.calls[0].url, '/api/home/stats')
  })

  it('a guest sends no token; a signed-in person sends theirs', async () => {
    const api = await load()
    net.reply(200, ok({ received: 0, resolved: 0, avgDays: 0, reopenedPercent: 0 }))
    await api.getStats()
    assert.equal('Authorization' in net.calls[0].headers, false)
    http.setToken('abc')
    await api.getStats()
    assert.equal(net.calls[1].headers.Authorization, 'Bearer abc')
  })

  it('a failure reaches the page as an Error with the server sentence', async () => {
    const api = await load()
    net.reply(400, fail('invalid', 'Choose a limit from 1 to 50.', 'limit'))
    await assert.rejects(api.getRecentActivity(999), (err) => {
      assert.equal(err.message, 'Choose a limit from 1 to 50.')
      assert.equal(err.field, 'limit')
      return true
    })
  })

  it('no connection is the network sentence', async () => {
    const api = await load()
    net.replyNetworkDown()
    await assert.rejects(api.getFixedThisWeek(), { code: 'network' })
  })
})

describe('issues (Map, Feed, issue page)', () => {
  it('getIssues asks GET /issues from the map centre, so every issue has a distance', async () => {
    const api = await load()
    const located = { id: 'a', rank: 1, lat: 22.355, lng: 91.825 }
    net.reply(200, ok([located]))
    assert.deepEqual(await api.getIssues(), [located])
    const { url, method } = net.calls[0]
    assert.equal(method, 'GET')
    const [path, query] = url.split('?')
    assert.equal(path, '/api/issues')
    const params = new URLSearchParams(query)
    assert.equal(params.get('lat'), '22.354')
    assert.equal(params.get('lng'), '91.824')
    assert.equal(params.get('category'), 'All')
    assert.equal(params.get('status'), 'All')
    assert.equal(params.has('search'), false, 'a blank search is not sent')
  })

  it('getIssues leaves out an issue with no coordinates, so no map page has to draw it', async () => {
    const api = await load()
    const located = { id: 'a', rank: 2, lat: 22.355, lng: 91.825 }
    net.reply(200, ok([{ id: 'b', rank: 1 }, located, { id: 'c', rank: 3, lat: null, lng: null }, { id: 'd', rank: 4, lat: 22.3 }]))
    assert.deepEqual(await api.getIssues(), [located])
  })

  it('includeUnlocated keeps every issue, for the Feed', async () => {
    const api = await load()
    const list = [{ id: 'b', rank: 1 }, { id: 'a', rank: 2, lat: 22.355, lng: 91.825 }]
    net.reply(200, ok(list))
    assert.deepEqual(await api.getIssues({ includeUnlocated: true }), list)
    assert.equal(net.calls[0].url.includes('includeUnlocated'), false, 'the flag is never sent to the server')
  })

  it('getIssues sends the filters and a trimmed search', async () => {
    const api = await load()
    net.reply(200, ok([]))
    await api.getIssues({ category: 'Roads', status: 'open', search: '  pothole ' })
    const params = new URLSearchParams(net.calls[0].url.split('?')[1])
    assert.equal(params.get('category'), 'Roads')
    assert.equal(params.get('status'), 'open')
    assert.equal(params.get('search'), 'pothole')
  })

  it('getIssues sends the signed-in citizen\'s token, so the server adds voted and mine', async () => {
    const api = await load()
    http.setToken('citizen.token')
    net.reply(200, ok([]))
    await api.getIssues()
    assert.equal(net.calls[0].headers.Authorization, 'Bearer citizen.token')
  })

  it('a server error reaches the page as an Error with a sentence', async () => {
    const api = await load()
    net.reply(400, fail('invalid', 'That category is not valid.', 'category'))
    await assert.rejects(api.getIssues({ category: 'Potholes' }), (e) => e.field === 'category')
  })

  it('getIssueById asks GET /issues/:id and gives the issue', async () => {
    const api = await load()
    net.reply(200, ok({ id: 'abc', title: 'Pothole' }))
    assert.deepEqual(await api.getIssueById('abc'), { id: 'abc', title: 'Pothole' })
    assert.ok(net.calls[0].url.startsWith('/api/issues/abc?'))
  })

  it('an unknown issue is null, so the page can say "not found"', async () => {
    const api = await load()
    net.reply(404, fail('not-found', 'We could not find that.'))
    assert.equal(await api.getIssueById('nope'), null)
  })

  it('any other failure is still an error, not "not found"', async () => {
    const api = await load()
    net.reply(500, fail('server-error', 'Something went wrong on our side. Please try again.'))
    await assert.rejects(api.getIssueById('abc'), (e) => e.code === 'server-error')
    net.reset()
    net.replyNetworkDown()
    await assert.rejects(api.getIssueById('abc'), (e) => e.code === 'network')
  })

  it('an id with odd characters is escaped in the address', async () => {
    const api = await load()
    net.reply(404, fail('not-found', 'x'))
    await api.getIssueById('a/b?c')
    assert.ok(net.calls[0].url.startsWith('/api/issues/a%2Fb%3Fc?'))
  })
})
