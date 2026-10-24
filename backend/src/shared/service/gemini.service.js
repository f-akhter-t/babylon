// The ONLY place that talks to Gemini. F4, F5, F6, F8 and F10 all call this file.
// Any failure (no key, timeout, API error, empty answer) becomes
// AppError('ai-unavailable', 503). Only report text and report photos go in.
import AppError from '../../utils/AppError.js'
import { AI_MESSAGES } from '../../constants/messages/ai.js'

const TIMEOUT_MS = 20_000
const DEFAULT_MODEL = 'gemini-2.5-flash'
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'

const unavailable = () => new AppError('ai-unavailable', 503, AI_MESSAGES.UNAVAILABLE)

// "data:image/png;base64,AAAA" -> { mimeType: 'image/png', data: 'AAAA' }
function readDataUrl(photoUrl) {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(String(photoUrl ?? ''))
  if (!match) throw new AppError('invalid', 400, AI_MESSAGES.PHOTO_INVALID, 'photoUrl')
  return { mimeType: match[1], data: match[2] }
}

async function call({ system, prompt, photoUrl, maxOutputTokens }) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw unavailable()

  const parts = [{ text: prompt }]
  if (photoUrl) parts.push({ inlineData: readDataUrl(photoUrl) })

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL
  let response
  try {
    response = await fetch(`${ENDPOINT}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        contents: [{ role: 'user', parts }],
        ...(maxOutputTokens ? { generationConfig: { maxOutputTokens } } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    throw unavailable() // network error or timeout
  }
  if (!response.ok) throw unavailable()

  let body
  try {
    body = await response.json()
  } catch {
    throw unavailable()
  }
  const text = (body?.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .join('')
    .trim()
  if (!text) throw unavailable()
  return text
}

// Text only. Returns plain text.
export function generateText({ system, prompt, maxOutputTokens } = {}) {
  return call({ system, prompt, maxOutputTokens })
}

// Text plus one report photo (a data URL). Returns plain text.
export function generateFromPhoto({ system, prompt, photoUrl, maxOutputTokens } = {}) {
  return call({ system, prompt, photoUrl, maxOutputTokens })
}