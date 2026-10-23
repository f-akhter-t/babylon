// Accounts and sign-in. log-in, sign-up, log-out and change-password talk to the
// Express backend (through http.js). The helpers below them (getAccount,
// isOnboarded, renameAccount ...) still read the browser's own copy of the
// accounts, because the parts of api.js that use them (profile, notifications,
// staff setup) are swapped in later steps. Pages do not change.
import { clearToken, getToken, patch, post, setToken, setUnauthorizedHandler } from './http.js'

const USERS_KEY = 'babylon-users' // accounts seen in this browser (no passwords)
const SESSION_KEY = 'babylon-session'
const NAMES_KEY = 'babylon-names' // names changed on the Profile page, by email

// Roles that sign up through the staff pages (/staff/login, /staff/signup).
// Citizens use /login and /signup.
export const STAFF_ROLES = [
  { id: 'department', label: 'Department' },
  { id: 'admin', label: 'Admin' },
]

// Shown as a hint on the staff sign-up page only. The backend refuses staff
// sign-up for now; the server will check the real code in the staff-accounts
// step, and then this line goes.
export const DEMO_STAFF_CODE = 'BABYLON-STAFF-2026'

const isStaffRole = (role) => role !== 'citizen'

// The three accounts made by `npm run seed:public`. They count as onboarded:
// their profiles come with demo details (api.js).
const DEMO_USERS = [
  { name: 'Nadia R.', email: 'citizen@babylon.test', role: 'citizen' },
  {
    name: 'Rafiq Hasan',
    email: 'roads@babylon.test',
    role: 'department',
    department: 'Roads & Highways',
  },
  { name: 'Tahmina Akter', email: 'admin@babylon.test', role: 'admin' },
]

// Demo accounts listed on each sign-in page: citizens on /login, staff on /staff/login.
export const DEMO_ACCOUNTS = {
  citizen: [{ role: 'Citizen', email: 'citizen@babylon.test' }],
  staff: [
    { role: 'Department', email: 'roads@babylon.test' },
    { role: 'Admin', email: 'admin@babylon.test' },
  ],
}
export const DEMO_PASSWORD = 'password123'

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) ?? []
  } catch {
    return []
  }
}

function allUsers() {
  return [...DEMO_USERS, ...readStored()]
}

// Read-only: the emails of the staff accounts with this role (and, for a
// department, this department). Used to send each of them a notification.
export function staffEmails({ role, department } = {}) {
  return allUsers()
    .filter((u) => u.role === role && (role !== 'department' || u.department === department))
    .map((u) => u.email)
}

function readNames() {
  try {
    return JSON.parse(localStorage.getItem(NAMES_KEY)) ?? {}
  } catch {
    return {}
  }
}

const isDemoUser = (email) => DEMO_USERS.some((u) => u.email.toLowerCase() === email.toLowerCase())

// The session never holds a password or the onboarding flag. The flag is
// read from the account each time (isOnboarded), so a stale copy in a
// session can never let anyone past the setup. (`password` is dropped too,
// for accounts stored by the mock version of this file.)
function publicUser({ password, onboarded, ...user }) {
  void password
  void onboarded
  const renamed = readNames()[user.email.toLowerCase()]
  return renamed ? { ...user, name: renamed } : user
}

function findUser(email) {
  if (!email) return null
  return allUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) ?? null
}

// The account's public details (no password), or null.
export function getAccount(email) {
  const user = findUser(email)
  return user ? publicUser(user) : null
}

// Staff must finish their profile before using the app. Citizens and the
// demo staff count as done; a stored staff account counts as done only once
// its flag is set, so an older account with no flag goes through the setup.
// Client-side only: a real backend must refuse a staff member's data until then.
export function isOnboarded(email) {
  const user = findUser(email)
  if (!user || !isStaffRole(user.role)) return true
  if (DEMO_USERS.includes(user)) return true
  return user.onboarded === true
}

// Set once, by completeOnboarding in api.js. Nothing ever clears it.
export function markOnboarded(email) {
  const key = email.toLowerCase()
  const stored = readStored().map((u) => (u.email.toLowerCase() === key ? { ...u, onboarded: true } : u))
  localStorage.setItem(USERS_KEY, JSON.stringify(stored))
}

// Each staff account's own profile page.
export function profilePathFor(role) {
  if (role === 'department') return '/department/profile'
  if (role === 'admin') return '/admin/profile'
  return '/profile'
}

export function homePathFor(role) {
  if (role === 'department') return '/department'
  if (role === 'admin') return '/admin/verify'
  return '/map'
}

// A session needs a token as well as the saved account: one without the other
// (an old demo-era session, a cleared token) counts as signed out.
export function getSession() {
  try {
    if (!getToken()) return null
    return JSON.parse(localStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

// Remember who signed in, so the parts of api.js that are not on the server yet
// (profile, notifications, names on reports) can still find the account by
// email. Holds no password. The three demo accounts are built in already.
// Goes away when those functions are swapped.
function rememberAccount(user) {
  if (isDemoUser(user.email)) return
  const key = user.email.toLowerCase()
  const entry = {
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.department ? { department: user.department } : {}),
    // A staff member's setup state comes from the server, as isOnboarded reads it.
    ...(isStaffRole(user.role) ? { onboarded: user.onboarded === true } : {}),
  }
  const others = readStored().filter((u) => u.email.toLowerCase() !== key)
  localStorage.setItem(USERS_KEY, JSON.stringify([...others, entry]))
}

// Saves the token and the account the server sent, and returns the session the
// pages use: { name, email, role, department? } (no id, no onboarding flag).
function startSession({ token, user }) {
  setToken(token)
  rememberAccount(user)
  const session = publicUser({
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.department ? { department: user.department } : {}),
  })
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

function endSession() {
  localStorage.removeItem(SESSION_KEY)
  clearToken()
}

// The server says the token is no longer good (expired, or its account is gone).
setUnauthorizedHandler(endSession)

// door: 'citizen' (/login) or 'staff' (/staff/login). Each door accepts only its
// own accounts, and the server reveals the account type only after the right
// password. A wrong door is an error with code 'staff-account' or
// 'citizen-account', so the page can link to the right sign-in page.
export async function login({ email, password, door }) {
  return startSession(await post('/auth/login', { email, password, door }, { auth: false }))
}

// Citizens only for now: the server refuses any other role. Staff accounts
// arrive with the staff-accounts step (open question 2).
export async function signup({ name, email, password, role }) {
  return startSession(await post('/auth/signup', { name, email, password, role }, { auth: false }))
}

// Changes the password of whoever is signed in, citizen or staff. The server
// reads the account from the token and stays signed in with the same token.
// A wrong current password comes back with field 'current', a bad or unchanged
// new one with field 'new', so the form puts each message under its own box.
export async function changePassword({ currentPassword, newPassword }) {
  await patch('/auth/password', { currentPassword, newPassword })
}

// The person is signed out here at once. The server is told too, but it keeps
// no list of tokens, so a failure there changes nothing.
export function logout() {
  const token = getToken()
  endSession()
  if (token) post('/auth/logout', undefined, { token }).catch(() => {})
}

// The name shown for an account, including a change made on the Profile page.
export function getAccountName(email) {
  if (!email) return null
  const user = allUsers().find((u) => u.email.toLowerCase() === email.toLowerCase())
  return user ? publicUser(user).name : null
}

// Saves a new display name. The email stays the same, so reports, votes
// and follows still belong to the account.
export function renameAccount(email, name) {
  const key = email.toLowerCase()
  localStorage.setItem(NAMES_KEY, JSON.stringify({ ...readNames(), [key]: name }))

  const session = getSession()
  if (session?.email.toLowerCase() === key) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, name }))
  }
}

// ---------- First-time profile setup ----------
// Set right after a new citizen signs up, so /profile opens as a welcome step.
// Kept in sessionStorage: it survives a refresh, ends with the tab, and is
// cleared when the person skips or leaves the profile page.
const setupKey = (email) => `babylon:setup:${email.toLowerCase()}`

export function startSetup(email) {
  try {
    sessionStorage.setItem(setupKey(email), '1')
  } catch {
    // storage blocked: the person simply sees the normal profile
  }
}

export function isInSetup(email) {
  try {
    return Boolean(email) && sessionStorage.getItem(setupKey(email)) === '1'
  } catch {
    return false
  }
}

export function endSetup(email) {
  try {
    sessionStorage.removeItem(setupKey(email))
  } catch {
    // nothing to clear
  }
}