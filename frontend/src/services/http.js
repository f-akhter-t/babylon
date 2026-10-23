// The one place that talks to the Express backend. Every service function that
// needs the server goes through here, so pages never see fetch(), URLs, tokens
// or response envelopes.
//
//   const data = await get('/issues', { query: { category: 'Roads' } })
//
// What it does for the caller:
//   - adds the token as "Authorization: Bearer ..." when someone is signed in
//   - gives back only `data` from { success, message, data }
//   - turns every failure into a plain Error whose `message` is a whole sentence
//     the page can show, with `code` and `field` from the server when it sent
//     them (`field` is how a form knows which box the message belongs to)

const TOKEN_KEY = 'babylon-token'

// In development Vite forwards /api to the backend (vite.config.js), so there is
// no CORS and no port to remember. For a deployed site set VITE_API_URL to the
// backend address, for example https://api.example.com/api
const API_URL = String(import.meta.env?.VITE_API_URL ?? '/api').replace(/\/+$/, '')

export const NETWORK_MESSAGE = 'We could not reach the server. Check your connection and try again.'
export const UNKNOWN_MESSAGE = 'Something went wrong. Please try again.'

// ---------- Token ----------
// Kept in localStorage so a refresh keeps the person signed in. Storage can be
// blocked (private window), so every access is guarded: the app then simply
// behaves as signed out.

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // storage blocked: the person will have to log in again after a refresh
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // nothing to clear
  }
}

// The server answered 401 to a request that carried a token: the token is
// expired, forged or its account is gone. auth.js registers a function here that
// forgets the session, so the next page the person opens sends them to log in.
let onUnauthorized = () => {}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = typeof handler === 'function' ? handler : () => {}
}

// ---------- Requests ----------

function failure(message, extra = {}) {
  return Object.assign(new Error(message), extra)
}

function withQuery(path, query) {
  if (!query) return path
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    // Blank values mean "no filter", so they are not sent at all.
    if (value !== undefined && value !== null && value !== '') params.append(key, String(value))
  }
  const text = params.toString()
  return text ? `${path}?${text}` : path
}

// options:
//   body   sent as JSON
//   query  { name: value } added to the address; blank values are left out
//   auth   false for log-in and sign-up: no token is sent and a 401 is not
//          treated as an expired session
//   token  use this token instead of the stored one (log-out uses it, because
//          it forgets the stored one first)
export async function request(method, path, { body, query, auth = true, token } = {}) {
  const sentToken = auth ? (token ?? getToken()) : null
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (sentToken) headers.Authorization = `Bearer ${sentToken}`

  let response
  try {
    response = await fetch(`${API_URL}${withQuery(path, query)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw failure(NETWORK_MESSAGE, { code: 'network' })
  }

  // A reply that is not JSON is not from our server (a proxy error page while
  // the backend is down, for example), so it is reported as unreachable.
  let payload
  try {
    payload = await response.json()
  } catch {
    throw failure(NETWORK_MESSAGE, { code: 'network', status: response.status })
  }

  if (response.ok && payload?.success !== false) return payload?.data

  if (response.status === 401 && sentToken && token === undefined) onUnauthorized()
  throw failure(payload?.message || UNKNOWN_MESSAGE, {
    code: payload?.code ?? 'server-error',
    status: response.status,
    ...(payload?.field ? { field: payload.field } : {}),
  })
}

export const get = (path, options) => request('GET', path, options)
export const post = (path, body, options) => request('POST', path, { ...options, body })
export const put = (path, body, options) => request('PUT', path, { ...options, body })
export const patch = (path, body, options) => request('PATCH', path, { ...options, body })
export const del = (path, options) => request('DELETE', path, options)
