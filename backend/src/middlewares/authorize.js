import AppError from '../utils/AppError.js'
import { ROLES } from '../constants/roles.js'
import { COMMON } from '../constants/messages/common.js'

export default function authorize(...roles) {
  return (req, res, next) => {
    const user = req.user
    if (!user) throw new AppError('unauthorized', 401, COMMON.unauthorized)
    if (!roles.includes(user.role)) throw new AppError('forbidden', 403, COMMON.forbidden)
    // Staff (department and admin) must finish their setup first (D13).
    const isStaff = user.role === ROLES.DEPARTMENT || user.role === ROLES.ADMIN
    if (isStaff && user.onboarded !== true) {
      throw new AppError('forbidden', 403, COMMON.notOnboarded)
    }
    next()
  }
}