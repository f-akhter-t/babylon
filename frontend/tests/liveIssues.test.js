// The live-issues source: a 15-second poll while anyone is subscribed (D22).
// Browser pieces are small stand-ins; time is moved by hand.
import { afterEach, beforeEach, describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'

const listenersOn = (target) => {
  const map = new Map()
  target.add = (name, fn) => map.set(name, [...(map.get(name) ?? []), fn])
  target.remove = (name, fn) => map.set(name, (map.get(name) ?? []).filter((f) => f !== fn))
  target.count = (name) => (map.get(name) ?? []).length
  target.fire = (name) => (map.get(name) ?? []).forEach((fn) => fn())
  return target
}

const win = listenersOn({})
globalThis.window = { addEventListener: win.add, removeEventListener: win.remove }
const doc = listenersOn({ visibilityState: 'visible' })
doc.addEventListener = doc.add
doc.removeEventListener = doc.remove
globalThis.document = doc
// A frame runs when the test says so; this keeps the order of events visible.
let frames = []
globalThis.requestAnimationFrame = (fn) => frames.push(fn)
globalThis.cancelAnimationFrame = (id) => void (frames[id - 1] = () => {})
const runFrames = () => {
  const now = frames
  frames = []
  now.forEach((fn) => fn())
}

const { subscribe, getSnapshot, POLL_MS } = await import('../src/hooks/liveIssues.js')
const { ISSUES_EVENT } = await import('../src/services/issuesEvent.js')

let calls
let stop
beforeEach(() => {
  mock.timers.enable({ apis: ['setInterval', 'setTimeout'] })
  frames = []
  doc.visibilityState = 'visible'
  calls = 0
})
afterEach(() => mock.timers.reset())
const listen = () => (stop = subscribe(() => calls++))

describe('liveIssues', () => {
  it('polls every 15 seconds while subscribed, marking the change as remote', () => {
    assert.equal(POLL_MS, 15_000)
    const before = getSnapshot().version
    listen()
    mock.timers.tick(POLL_MS - 1)
    runFrames()
    assert.equal(calls, 0)
    mock.timers.tick(1)
    runFrames()
    assert.equal(calls, 1)
    assert.equal(getSnapshot().version, before + 1)
    assert.equal(getSnapshot().remote, true)
    assert.equal(getSnapshot().animate, true)
    mock.timers.tick(POLL_MS)
    runFrames()
    assert.equal(calls, 2)
    stop()
  })

  it('stops polling when the last page unsubscribes', () => {
    listen()
    stop()
    mock.timers.tick(POLL_MS * 4)
    runFrames()
    assert.equal(calls, 0)
    assert.equal(win.count(ISSUES_EVENT), 0)
    assert.equal(doc.count('visibilitychange'), 0)
  })

  it('two pages share one timer; it stops after the second leaves', () => {
    const stopOne = subscribe(() => calls++)
    const stopTwo = subscribe(() => calls++)
    mock.timers.tick(POLL_MS)
    runFrames()
    assert.equal(calls, 2, 'both pages are told once')
    stopOne()
    mock.timers.tick(POLL_MS)
    runFrames()
    assert.equal(calls, 3, 'the remaining page is still polled')
    stopTwo()
    mock.timers.tick(POLL_MS * 3)
    runFrames()
    assert.equal(calls, 3)
  })

  it('a hidden tab does not poll, and catches up the moment it is shown again', () => {
    listen()
    doc.visibilityState = 'hidden'
    mock.timers.tick(POLL_MS * 3)
    mock.timers.tick(0)
    runFrames()
    assert.equal(calls, 0)
    doc.visibilityState = 'visible'
    doc.fire('visibilitychange')
    runFrames()
    assert.equal(calls, 1)
    stop()
  })

  it('this tab\'s own change (ISSUES_EVENT) is told at once, and is not remote', () => {
    listen()
    win.fire(ISSUES_EVENT)
    runFrames()
    assert.equal(calls, 1)
    assert.equal(getSnapshot().remote, false)
    stop()
  })

  it('events in one frame become one update', () => {
    listen()
    win.fire(ISSUES_EVENT)
    win.fire(ISSUES_EVENT)
    doc.fire('visibilitychange')
    runFrames()
    assert.equal(calls, 1)
    stop()
  })

  it('the browser storage event no longer moves anything', () => {
    listen()
    assert.equal(win.count('storage'), 0)
    stop()
  })
})
