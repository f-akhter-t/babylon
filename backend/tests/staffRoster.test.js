// The only reader of the staff secrets. With nothing set, nobody passes.
import { test } from 'node:test'
import assert from 'node:assert/strict'

process.env.JWT_SECRET = 'test-secret-not-real'
process.env.MONGODB_URI = 'mongodb://localhost/none'

const { env } = await import('../src/config/env.js')
const roster = await import('../src/auth/service/staffRoster.service.js')

const set = (values, run) => {
  const saved = { ...env }
  Object.assign(env, values)
  try { return run() } finally { Object.assign(env, saved) }
}

test('with no secrets set nothing matches, not even an empty string or "undefined"', () => {
  set({ staffAccessCode: '', departmentCodes: {}, employeeRoster: {} }, () => {
    for (const typed of ['', ' ', 'undefined', 'null', undefined, null]) {
      assert.equal(roster.accessCodeMatches(typed), false)
      assert.equal(roster.departmentCodeMatches('Electricity', typed), false)
    }
    assert.equal(roster.isOnRoster({ role: 'department', department: 'Electricity' }, 'E-EL-1'), false)
    assert.equal(roster.isOnRoster({ role: 'admin' }, ''), false)
  })
})

test('codes match ignoring case and spaces, and only for the right department', () => {
  set({ staffAccessCode: 'Open-Sesame', departmentCodes: { Electricity: 'TEST-CODE-1' }, employeeRoster: {} }, () => {
    assert.equal(roster.accessCodeMatches(' open-sesame '), true)
    assert.equal(roster.accessCodeMatches('open-sesam'), false)
    assert.equal(roster.departmentCodeMatches('Electricity', 'TEST-CODE-1'), true)
    assert.equal(roster.departmentCodeMatches('Water Supply', 'TEST-CODE-1'), false)
  })
})

test('a roster list that is not an array (a bad setting) lets nobody in', () => {
  set({ employeeRoster: { Electricity: 'E-EL-1', admin: null } }, () => {
    assert.equal(roster.isOnRoster({ role: 'department', department: 'Electricity' }, 'E-EL-1'), false)
    assert.equal(roster.isOnRoster({ role: 'admin' }, 'E-AD-1'), false)
  })
})

test('Employee IDs are compared in capitals; admins use only the admin list', () => {
  set({ employeeRoster: { Electricity: ['e-el-1'], admin: ['E-AD-1'] } }, () => {
    assert.equal(roster.normalizeEmployeeId(' e-el-1 '), 'E-EL-1')
    assert.equal(roster.isOnRoster({ role: 'department', department: 'Electricity' }, 'E-EL-1'), true)
    assert.equal(roster.isOnRoster({ role: 'admin', department: 'Electricity' }, 'E-EL-1'), false)
    assert.equal(roster.isOnRoster({ role: 'admin' }, 'e-ad-1'), true)
  })
})
