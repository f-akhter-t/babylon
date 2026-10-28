import bcrypt from 'bcrypt'
import { BCRYPT_COST } from '../constants/auth.js'

export const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_COST)

// Never throws: a stored value that is not a real hash (the "no login" marker the
// seeds use for staff) simply does not match.
export async function verifyPassword(plain, hash) {
  try {
    return await bcrypt.compare(plain, hash)
  } catch {
    return false
  }
}

// Compared against when the email is unknown, so "no such account" takes as long
// as "wrong password" and the time cannot be used to find out which emails exist.
let decoy
export const decoyHash = () => (decoy ??= bcrypt.hash('not-a-real-password', BCRYPT_COST))
