import AppError from '../utils/AppError.js'
import { COMMON } from '../constants/messages/common.js'

function describe(err) {
  if (err instanceof AppError) {
    return { status: err.status, code: err.code, message: err.message, field: err.field }
  }
  if (err.type === 'entity.parse.failed') return { status: 400, code: 'invalid', message: COMMON.badJson }
  if (err.type === 'entity.too.large' || err.name === 'MulterError') {
    return { status: 400, code: 'invalid', message: COMMON.tooLarge }
  }
  if (err.name === 'ZodError' || err.name === 'ValidationError') {
    return { status: 400, code: 'invalid', message: COMMON.invalid }
  }
  if (err.name === 'CastError') return { status: 404, code: 'not-found', message: COMMON.notFound }
  if (err.code === 11000) return { status: 409, code: 'conflict', message: COMMON.conflict }
  return null
}

// Express needs all four arguments to know this is an error handler.
export default function errorHandler(err, req, res, next) {
  const known = describe(err)
  if (!known) console.error(err)
  const { status, code, message, field } =
    known ?? { status: 500, code: 'server-error', message: COMMON.server }
  res.status(status).json({ success: false, code, message, ...(field ? { field } : {}) })
}