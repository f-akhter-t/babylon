// Shared fakes for the service tests: a browser's localStorage and a fetch that
// answers with whatever the test queued. Nothing here touches a network.
export function installBrowser() {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => void store.set(key, String(value)),
    removeItem: (key) => void store.delete(key),
    clear: () => store.clear(),
  }
  globalThis.sessionStorage = globalThis.localStorage
  return store
}

// Queue replies with reply(status, body). Each fetch takes the next one (the last
// one repeats). `calls` records { url, method, headers, body } for each request.
export function installFetch() {
  const calls = []
  let queue = []
  globalThis.fetch = async (url, init = {}) => {
    calls.push({
      url,
      method: init.method,
      headers: init.headers ?? {},
      body: init.body === undefined ? undefined : JSON.parse(init.body),
    })
    const next = queue.length > 1 ? queue.shift() : queue[0]
    if (!next) throw new Error('no reply queued')
    if (next.throws) throw new TypeError('Failed to fetch')
    return {
      ok: next.status >= 200 && next.status < 300,
      status: next.status,
      json: async () => {
        if (next.notJson) throw new SyntaxError('Unexpected token <')
        return next.body
      },
    }
  }
  return {
    calls,
    reply: (status, body) => void (queue = [...queue, { status, body }]),
    replyNotJson: (status) => void (queue = [...queue, { status, notJson: true }]),
    replyNetworkDown: () => void (queue = [...queue, { throws: true }]),
    reset: () => {
      calls.length = 0
      queue = []
    },
  }
}

export const ok = (data, message = 'ok') => ({ success: true, message, data })
export const fail = (code, message, field) => ({
  success: false,
  code,
  message,
  ...(field ? { field } : {}),
})
