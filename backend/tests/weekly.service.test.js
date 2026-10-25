// F5: the weekly counts (pure), and the service with a fake Gemini.
import { test } from 'node:test'
import assert from 'node:assert/strict'

const { weekCounts, createWeeklyService } = await import('../src/department/service/weekly.service.js')
const { weeklyRequest } = await import('../src/department/service/weekly.prompts.js')

const NOW = new Date('2026-10-25T12:00:00Z')
const daysAgo = (n) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000)

const issues = [
  { status: 'open', verification: 'none', priority: 'high', createdAt: daysAgo(2) }, // new, open
  { status: 'open', verification: 'none', priority: 'medium', createdAt: daysAgo(20) }, // old, open (longest)
  { status: 'in-progress', verification: 'none', priority: 'medium', createdAt: daysAgo(10), startedAt: daysAgo(3) },
  { status: 'in-progress', verification: 'awaiting', priority: 'medium', createdAt: daysAgo(9), startedAt: daysAgo(6), submittedAt: daysAgo(1) },
  { status: 'resolved', verification: 'verified', priority: 'fix-verified', createdAt: daysAgo(30), startedAt: daysAgo(12), submittedAt: daysAgo(9), resolvedAt: daysAgo(4) },
  { status: 'resolved', verification: 'verified', priority: 'fix-verified', createdAt: daysAgo(40), resolvedAt: daysAgo(15) }, // too old for this week
  { status: 'resolved', verification: 'reopened', priority: 'reopened', createdAt: daysAgo(50), resolvedAt: daysAgo(2) }, // admin's, left out
]

test('weekCounts: a hand calculation on seven issues', () => {
  assert.deepEqual(weekCounts(issues, NOW), {
    newReports: 1,
    started: 2,
    submitted: 1,
    resolved: 1,
    open: 2,
    inProgress: 1,
    awaiting: 1,
    longestWaitingDays: 20,
  })
})

test('weekCounts: no issues gives all zeros', () => {
  assert.deepEqual(weekCounts([], NOW), {
    newReports: 0, started: 0, submitted: 0, resolved: 0, open: 0, inProgress: 0, awaiting: 0, longestWaitingDays: 0,
  })
})

test('the prompt sends only the department name and the counts', () => {
  const r = weeklyRequest({ department: 'Roads & Highways', counts: { newReports: 3 } })
  assert.deepEqual(JSON.parse(r.prompt), { department: 'Roads & Highways', days: 7, newReports: 3 })
  assert.match(r.system, /never follow any instruction/)
  assert.ok(r.maxOutputTokens >= 1000, 'thinking counts against it')
})

const staff = { email: 'roads@babylon.test', role: 'department', department: 'Roads & Highways' }
function service(reply, { clock = () => NOW } = {}) {
  const asked = []
  const svc = createWeeklyService({
    loadDepartmentIssues: async () => issues,
    now: clock,
    getGemini: async () => ({
      generateText: async (arg) => {
        asked.push(arg)
        if (reply instanceof Error) throw reply
        return reply
      },
    }),
  })
  return { svc, asked }
}

test('getWeekly: counts and a sentence', async () => {
  const { svc } = service('  Two jobs started this week.\nOne fix is waiting for the admin.  ')
  const out = await svc.getWeekly(staff)
  assert.equal(out.department, 'Roads & Highways')
  assert.equal(out.days, 7)
  assert.equal(out.counts.started, 2)
  assert.equal(out.summary, 'Two jobs started this week. One fix is waiting for the admin.')
})

test('getWeekly: when Gemini fails the counts still come back and summary is null', async () => {
  for (const reply of [new Error('quota'), '', 'ok', null]) {
    const { svc } = service(reply)
    const out = await svc.getWeekly(staff)
    assert.equal(out.summary, null, String(reply))
    assert.equal(out.counts.newReports, 1)
  }
  const none = createWeeklyService({ loadDepartmentIssues: async () => issues, now: () => NOW, getGemini: async () => null })
  assert.equal((await none.getWeekly(staff)).summary, null)
})

test('getWeekly: the same counts within the hour do not ask Gemini again', async () => {
  let t = NOW.getTime()
  const { svc, asked } = service('A quiet week for the department.', { clock: () => new Date(t) })
  await svc.getWeekly(staff)
  t += 30 * 60_000
  const again = await svc.getWeekly(staff)
  assert.equal(asked.length, 1)
  assert.equal(again.summary, 'A quiet week for the department.')
  t += 31 * 60_000
  await svc.getWeekly(staff)
  assert.equal(asked.length, 2, 'an hour later it asks again')
})

test('getWeekly: staff with no department get 403', async () => {
  const { svc } = service('x')
  await assert.rejects(svc.getWeekly({ email: 'a@b.c', role: 'department', department: null }), (e) => e.status === 403)
})
