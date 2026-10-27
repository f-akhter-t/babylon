// Accounts and sign-in. log-in, sign-up (citizens and staff), log-out and
// change-password talk to the Express backend (through http.js). The helpers
// below them (getAccount, renameAccount ...) still read the browser's own copy of
// the accounts, because the parts of api.js that use them (citizen profile,
// notifications) are swapped in later steps. Pages do not change.
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

const isStaffRole = (role) => role !== 'citizen'

// The three accounts made by `npm run seed:public`.
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

// The session never holds a password. (`password` is dropped for accounts
// stored by the mock version of this file.)
function publicUser({ password, ...user }) {
  void password
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

// A staff account that has not finished its profile setup: the server said
// onboarded: false when it signed in, and finishing the setup (api.js) sets it
// to true. Read fresh from the saved session every time it is called, because
// the gate and the layouts sit above pages that never remount. Citizens are
// never held back. This only decides what the screens show: the server refuses
// a staff token that is not onboarded on every panel route (403).
export function isSetupPending() {
  const session = getSession()
  return Boolean(session) && isStaffRole(session.role) && session.onboarded === false
}

// Each staff account's own profile page.
export function profilePathFor(role) {
  if (role === 'department') return '/department/profile'
  if (role === 'admin') return '/admin/profile'
  return '/profile'
}

export function homePathFor(role) {
  if (role === 'department') return '/department/dashboard'
  if (role === 'admin') return '/admin/dashboard'
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
  }
  const others = readStored().filter((u) => u.email.toLowerCase() !== key)
  localStorage.setItem(USERS_KEY, JSON.stringify([...others, entry]))
}

// Saves the token and the account the server sent, and returns the session the
// pages use: { name, email, role, department?, onboarded? } (no id). Only staff
// carry `onboarded`: the setup they still have to finish (see isSetupPending).
function startSession({ token, user }) {
  setToken(token)
  rememberAccount(user)
  const session = publicUser({
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.department ? { department: user.department } : {}),
    ...(isStaffRole(user.role) ? { onboarded: user.onboarded === true } : {}),
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

// Citizens only: the server refuses any other role here. Staff sign up with
// staffSignup below.
export async function signup({ name, email, password, role }) {
  return startSession(await post('/auth/signup', { name, email, password, role }, { auth: false }))
}

// A department or admin account. The server checks the staff access code (it is
// not in the app) and makes the account NOT onboarded: the person lands on their
// profile page to finish the setup. department is sent for a department account
// only; a wrong code comes back with field 'accessCode'.
export async function staffSignup({ name, email, password, role, department, accessCode }) {
  const body = { name, email, password, role, accessCode }
  if (role === 'department') body.department = department
  return startSession(await post('/auth/staff/signup', body, { auth: false }))
}

// Changes the saved session of whoever is signed in: a new token (the setup was
// finished) and/or changed details (a new name). It tells nobody; the caller
// fires its own refresh event (PROFILE_EVENT in api.js).
export function updateSession({ token, ...changes } = {}) {
  if (token) setToken(token)
  const session = getSession()
  if (!session) return null
  const next = { ...session, ...changes }
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(next))
  } catch {
    // storage blocked: the old session stays; the next sign-in sets it right
  }
  return next
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