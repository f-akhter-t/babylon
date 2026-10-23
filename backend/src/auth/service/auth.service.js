// Every account rule lives here. Controllers only pass the request in.
import User from '../../models/user.model.js'
import AppError from '../../utils/AppError.js'
import { signToken } from '../../utils/token.js'
import { decoyHash, hashPassword, verifyPassword } from '../../utils/password.js'
import { ROLES } from '../../constants/roles.js'
import { COMMON } from '../../constants/messages/common.js'
import { AUTH_MESSAGES as M } from '../../constants/messages/auth.js'

// What the app needs to know about the person who is signed in. Picked by name,
// so passwordHash (or any field added to the model later) can never leak.
function toSessionUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department ?? null,
    onboarded: user.onboarded !== false,
  }
}

function issueToken(user) {
  const session = toSessionUser(user)
  return signToken({
    email: session.email,
    role: session.role,
    department: session.department,
    onboarded: session.onboarded, // a staff member still setting up gets false
  })
}

const emailTaken = () => new AppError('conflict', 409, M.emailTaken, 'email')

// Sign-up makes citizens only. Staff accounts come from open question 2.
export async function signup({ name, email, password }) {
  if (await User.exists({ email })) throw emailTaken()

  const passwordHash = await hashPassword(password)
  let user
  try {
    user = await User.create({ name, email, passwordHash, role: ROLES.CITIZEN })
  } catch (err) {
    // Two sign-ups at the same moment: the unique index lets only one through.
    if (err?.code === 11000) throw emailTaken()
    throw err
  }
  return { token: issueToken(user), user: toSessionUser(user) }
}

// door is the sign-in page used. It is checked only after the password is right,
// so the page never tells a stranger what kind of account an email belongs to.
export async function login({ email, password, door }) {
  const user = await User.findOne({ email }).select('+passwordHash').lean()
  // An unknown email is compared with a decoy hash: same answer, same time.
  const matches = await verifyPassword(password, user?.passwordHash ?? (await decoyHash()))
  if (!user || !matches) throw new AppError('unauthorized', 401, M.badLogin)

  const isCitizen = user.role === ROLES.CITIZEN
  if (door === 'citizen' && !isCitizen) throw new AppError('staff-account', 403, M.staffAccount)
  if (door === 'staff' && isCitizen) throw new AppError('citizen-account', 403, M.citizenAccount)

  return { token: issueToken(user), user: toSessionUser(user) }
}

// The person comes from the token. An account that no longer exists is a 401.
export async function getMe(email) {
  const user = await User.findOne({ email }).lean()
  if (!user) throw new AppError('unauthorized', 401, COMMON.unauthorized)
  return toSessionUser(user)
}

export async function changePassword(email, { currentPassword, newPassword }) {
  const user = await User.findOne({ email }).select('+passwordHash').lean()
  if (!user) throw new AppError('unauthorized', 401, COMMON.unauthorized)

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new AppError('invalid', 400, M.currentWrong, 'current')
  }
  if (newPassword === currentPassword) throw new AppError('invalid', 400, M.newSame, 'new')

  await User.updateOne({ _id: user._id }, { $set: { passwordHash: await hashPassword(newPassword) } })
}
