import AppError from '../utils/AppError.js'
import { verifyToken } from '../utils/token.js'
import { COMMON } from '../constants/messages/common.js'

function readUser(req) {
  const [scheme, token] = (req.headers.authorization || '').split(' ')
  if (scheme !== 'Bearer' || !token) return null
  try {
    return verifyToken(token)
  } catch {
    return null
  }
}

export default function authenticate(req, res, next) {
  const user = readUser(req)
  if (!user) throw new AppError('unauthorized', 401, COMMON.unauthorized)
  req.user = user
  next()
}

authenticate.optional = (req, res, next) => {
  req.user = readUser(req)
  next()
}