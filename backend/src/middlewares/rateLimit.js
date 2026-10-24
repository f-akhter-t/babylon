import AppError from '../utils/AppError.js'

// rateLimit({ windowMs, max, message, now? }): at most `max` requests per signed-in
// user in each window; the next one answers 429 too-many-requests. Counts live
// in memory, so they reset on restart. Put it after authenticate().
export function rateLimit({ windowMs, max, message, now = Date.now }) {
  const hits = new Map()
  return (req, res, next) => {
    const t = now()
    const key = req.user?.email || req.ip
    const recent = (hits.get(key) || []).filter((time) => t - time < windowMs)
    if (recent.length >= max) {
      hits.set(key, recent)
      throw new AppError('too-many-requests', 429, message)
    }
    recent.push(t)
    hits.set(key, recent)
    if (hits.size > 5000) {
      for (const [k, times] of hits) if (!times.some((time) => t - time < windowMs)) hits.delete(k)
    }
    next()
  }
}

export default rateLimit
