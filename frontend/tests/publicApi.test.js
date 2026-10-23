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
