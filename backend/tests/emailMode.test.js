import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pickEmailMode } from '../src/config/emailMode.js'

test('dev mode works outside production', () => {
  assert.deepEqual(pickEmailMode({ mode: 'dev', isProduction: false }), { mode: 'dev' })
})

test('dev mode is refused in production, with a reason', () => {
  const result = pickEmailMode({ mode: 'dev', isProduction: true })
  assert.equal(result.mode, 'off')
  assert.match(result.problem, /NODE_ENV=production/)
})

test('smtp mode needs both the address and the app password', () => {
  assert.deepEqual(pickEmailMode({ mode: 'smtp', user: 'a@gmail.com', password: 'abcd', isProduction: true }), { mode: 'smtp' })
  for (const missing of [{ user: '', password: 'abcd' }, { user: 'a@gmail.com', password: '' }, {}]) {
    const result = pickEmailMode({ mode: 'smtp', isProduction: false, ...missing })
    assert.equal(result.mode, 'off')
    assert.match(result.problem, /EMAIL_USER and EMAIL_APP_PASSWORD/)
  }
})

test('a missing or unknown mode is off, and the reason never contains a secret', () => {
  for (const mode of [undefined, '', 'DEV', 'on', 'true']) {
    assert.deepEqual(pickEmailMode({ mode, user: 'a@gmail.com', password: 'secret-pass', isProduction: false }), { mode: 'off' })
  }
  const result = pickEmailMode({ mode: 'smtp', user: 'a@gmail.com', password: '', isProduction: false })
  assert.ok(!JSON.stringify(result).includes('a@gmail.com'))
})
