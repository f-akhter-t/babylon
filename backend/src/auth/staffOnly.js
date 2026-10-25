// Lets department and admin accounts through, whether or not they have finished
// their setup (authorize() would stop them until they have). Used by the staff
// routes under /api/auth/staff, which are how a new account finishes setting up.
import AppError from '../utils/AppError.js'
import { ROLES } from '../constants/roles.js'
import { COMMON } from '../constants/messages/common.js'
import { AUTH_MESSAGES as M } from '../constants/messages/auth.js'

export default function staffOnly(req, res, next) {
  const role = req.user?.role
  if (!req.user) throw new AppError('unauthorized', 401, COMMON.unauthorized)
  if (role !== ROLES.DEPARTMENT && role !== ROLES.ADMIN) throw new AppError('forbidden', 403, M.staffOnly)
  next()
}
