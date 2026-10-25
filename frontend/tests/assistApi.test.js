import { beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fail, installBrowser, installFetch, ok } from './helpers.js'

const store = installBrowser()
const net = installFetch()
const http = await import('../src/services/http.js')
const assist = await import('../src/services/assistApi.js')

const PHOTO = 'data:image/jpeg;base64,/9j/4AAQ'

beforeEach(() => {
  store.clear()
  net.reset()
  http.setToken('citizen-token')
  http.setUnauthorizedHandler(() => {})
})

const last = () => net.calls.at(-1)

describe('F6 report suggestion', () => {
  it('posts only the photo, and the category when one is chosen', async () => {
    net.reply(200, ok({ category: 'Roads', description: 'A deep pothole in the road.' }))
    const result = await assist.getReportSuggestion({ photoUrl: PHOTO, category: '' })
    assert.deepEqual(result, { category: 'Roads', description: 'A deep pothole in the road.' })
    assert.equal(last().url, '/api/citizen/reports/assist')
    assert.equal(last().method, 'POST')
    assert.equal(last().headers.Authorization, 'Bearer citizen-token')
    assert.deepEqual(last().body, { photoUrl: PHOTO })

    await assist.getReportSuggestion({ photoUrl: PHOTO, category: 'Waste' })
    assert.deepEqual(last().body, { photoUrl: PHOTO, category: 'Waste' })
  })

  it('gives back a null category when the assistant could not tell', async () => {
    net.reply(200, ok({ category: null, description: 'Rubbish piled up beside the drain.' }))
    assert.equal((await assist.getReportSuggestion({ photoUrl: PHOTO })).category, null)
  })

  it('a server refusal keeps its status, code and field', async () => {
    net.reply(400, fail('invalid', 'Please send the photo as an image (JPEG, PNG or WebP).', 'photoUrl'))
    await assert.rejects(
      assist.getReportSuggestion({ photoUrl: 'x' }),
      (e) => e.status === 400 && e.field === 'photoUrl',
    )
  })
})

describe('F8 report summary', () => {
  it('posts the text and gives back the summary string', async () => {
    net.reply(200, ok({ summary: 'Deep pothole near Station Road school.' }))
    assert.equal(await assist.getReportSummary('A big pothole on Station Road near the school.'), 'Deep pothole near Station Road school.')
    assert.equal(last().url, '/api/citizen/reports/summarize')
    assert.equal(last().method, 'POST')
    assert.deepEqual(last().body, { text: 'A big pothole on Station Road near the school.' })
  })

  it('canSummarize needs at least 10 characters after trimming', () => {
    assert.equal(assist.canSummarize(''), false)
    assert.equal(assist.canSummarize(undefined), false)
    assert.equal(assist.canSummarize('   short    '), false)
    assert.equal(assist.canSummarize('Broken lamp'), true)
    assert.equal(assist.canSummarize('x'.repeat(assist.SUMMARIZE_TEXT_MIN)), true)
  })
})

describe('readable sentences for every failure', () => {
  async function errorFor(call) {
    try {
      await call()
    } catch (error) {
      return error
    }
    throw new Error('expected a failure')
  }
  const summarize = () => assist.getReportSummary('A big pothole on Station Road.')

  it('401 asks the citizen to log in again and clears nothing itself', async () => {
    let handled = 0
    http.setUnauthorizedHandler(() => (handled += 1))
    net.reply(401, fail('unauthorized', 'Token expired.'))
    const error = await errorFor(summarize)
    assert.equal(assist.assistErrorMessage(error), assist.ASSIST_MESSAGES.loggedOut)
    assert.equal(handled, 1, 'http.js forgets the expired session')
  })

  it('403 says the assistant is for citizens', async () => {
    net.reply(403, fail('forbidden', 'You do not have access.'))
    assert.equal(assist.assistErrorMessage(await errorFor(summarize)), assist.ASSIST_MESSAGES.notCitizen)
  })

  it('429 asks the citizen to wait, even when the answer is not JSON', async () => {
    net.reply(429, fail('too-many-requests', 'You are asking the assistant too fast. Please wait a moment and try again.'))
    assert.equal(assist.assistErrorMessage(await errorFor(summarize)), assist.ASSIST_MESSAGES.tooMany)
    net.reset()
    net.replyNotJson(429)
    assert.equal(assist.assistErrorMessage(await errorFor(summarize)), assist.ASSIST_MESSAGES.tooMany)
  })

  it('503 ai-unavailable tells the citizen to carry on by hand', async () => {
    net.reply(503, fail('ai-unavailable', 'The assistant is not available right now. Please try again in a moment.'))
    const message = assist.assistErrorMessage(await errorFor(summarize))
    assert.equal(message, assist.ASSIST_MESSAGES.unavailable)
    assert.match(message, /fill in the report yourself/)
  })

  it('a proxy page for 503 or 413 is still a readable sentence', async () => {
    net.replyNotJson(503)
    assert.equal(assist.assistErrorMessage(await errorFor(summarize)), assist.ASSIST_MESSAGES.unavailable)
    net.reset()
    net.replyNotJson(413)
    assert.equal(
      assist.assistErrorMessage(await errorFor(() => assist.getReportSuggestion({ photoUrl: PHOTO }))),
      assist.ASSIST_MESSAGES.photoTooBig,
    )
  })

  it('a 400 keeps the server sentence, which names the exact problem', async () => {
    net.reply(400, fail('invalid', 'Write at least 10 characters first, then ask for a summary.', 'text'))
    assert.equal(
      assist.assistErrorMessage(await errorFor(summarize)),
      'Write at least 10 characters first, then ask for a summary.',
    )
  })

  it('no connection keeps the connection sentence', async () => {
    net.replyNetworkDown()
    assert.equal(assist.assistErrorMessage(await errorFor(summarize)), http.NETWORK_MESSAGE)
  })

  it('anything else falls back to a general sentence, never a technical message', () => {
    assert.equal(assist.assistErrorMessage(new TypeError('x is undefined')), assist.ASSIST_MESSAGES.other)
    assert.equal(assist.assistErrorMessage(undefined), assist.ASSIST_MESSAGES.other)
    assert.equal(assist.assistErrorMessage({ status: 500, message: 'Cast to ObjectId failed' }), assist.ASSIST_MESSAGES.other)
  })
})
