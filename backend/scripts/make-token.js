import { signToken } from '../src/utils/token.js'
import { ROLES } from '../src/constants/roles.js'

if (process.env.NODE_ENV === 'production') {
  console.error('This script must not run in production.')
  process.exit(1)
}

const [role, email, department] = process.argv.slice(2)
const roles = Object.values(ROLES)
if (!roles.includes(role) || !email) {
  console.error(`Usage: npm run token -- <${roles.join('|')}> <email> [department]`)
  process.exit(1)
}

console.log(signToken({ email: email.toLowerCase(), role, department: department ?? null, onboarded: true }))