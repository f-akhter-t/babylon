// Forgot password and reset password. Both are for anyone with an account
// (citizen or staff) and work with a code sent to the account's email.
import User from '../../models/user.model.js'
import AppError from '../../utils/AppError.js'
import { hashPassword } from '../../utils/password.js'
import { EMAIL_CODE_LIMITS } from '../../constants/limits.js'
import { MSG } from '../../constants/messages/index.js'
import { assertAvailable, sendCode, verifyCode } from '../../shared/service/emailCode.service.js'

const PURPOSE = 'reset'

// Asking again too soon, or a mail server that says no, must not change the
// answer: the reply is the same for every email address, so it cannot be used
// to find out which emails have an account.
const QUIET = ['too-many-requests', 'email-unavailable']

// -> { resendAfter }, always, whether or not the email has an account.
export async function forgotPassword({ email }, now = Date.now()) {
  assertAvailable()
  const user = await User.findOne({ email }).lean()
  if (user) {
    try {
      await sendCode({ userId: user._id, email: user.email, purpose: PURPOSE }, now)
    } catch (err) {
      if (!(err instanceof AppError) || !QUIET.includes(err.code)) throw err
    }
  }
  return { resendAfter: EMAIL_CODE_LIMITS.resendSeconds }
}

export async function resetPassword({ email, code, newPassword }, now = Date.now()) {
  assertAvailable()
  const user = await User.findOne({ email }).lean()
  // No account gets the same answer as a wrong code.
  if (!user) throw new AppError('invalid', 400, MSG.emailCodeWrong, 'code')

  await verifyCode({ userId: user._id, email: user.email, purpose: PURPOSE, code }, now)
  await User.updateOne({ _id: user._id }, { $set: { passwordHash: await hashPassword(newPassword) } })
}
