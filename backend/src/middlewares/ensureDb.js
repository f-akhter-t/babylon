import { connectDb } from '../config/db.js'
import AppError from '../utils/AppError.js'
import { COMMON } from '../constants/messages/common.js'

// Makes sure the database is connected before a request is handled. Locally
// server.js has already connected, so this does nothing. On Vercel the first
// request does the connecting. If the database cannot be reached the answer is
// the standard 500, with no technical detail.
export default async function ensureDb(req, res, next) {
  try {
    await connectDb()
    next()
  } catch (err) {
    console.error('Could not connect to the database:', err.message)
    next(new AppError('server-error', 500, COMMON.server))
  }
}
