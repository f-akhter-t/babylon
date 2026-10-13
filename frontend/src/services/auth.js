// Mock login. Accounts live in the browser (localStorage) until the backend exists.
// Later, each function becomes a fetch() call to Express and pages will not change.

const USERS_KEY = 'babylon-users'
const SESSION_KEY = 'babylon-session'
const NAMES_KEY = 'babylon-names' // names changed on the Profile page, by email

export const ROLES = [
  { id: 'citizen', label: 'Citizen' },
  { id: 'department', label: 'Department' },
  { id: 'admin', label: 'Admin' },
]

// Demo accounts so every role can be tried without signing up first.
const DEMO_USERS = [
  { name: 'Nadia R.', email: 'citizen@babylon.test', password: 'password123', role: 'citizen' },
  {
    name: 'Roads & Highways',
    email: 'roads@babylon.test',
    password: 'password123',
    role: 'department',
    department: 'Roads & Highways',
  },
  { name: 'Admin', email: 'admin@babylon.test', password: 'password123', role: 'admin' },
]

export const DEMO_LOGIN = {
  citizen: 'citizen@babylon.test',
  department: 'roads@babylon.test',
  admin: 'admin@babylon.test',
}

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

function readNames() {
  try {
    return JSON.parse(localStorage.getItem(NAMES_KEY)) ?? {}
  } catch {
    return {}
  }
}

function publicUser({ password, ...user }) {
  void password
  const renamed = readNames()[user.email.toLowerCase()]
  return renamed ? { ...user, name: renamed } : user
}

export function homePathFor(role) {
  if (role === 'department') return '/department'
  if (role === 'admin') return '/admin/verify'
  return '/map'
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

export async function login({ email, password, role }) {
  const user = allUsers().find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.role === role,
  )
  if (!user || user.password !== password) {
    throw new Error('Wrong email or password for this account type.')
  }
  const session = publicUser(user)
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export async function signup({ name, email, password, role, department }) {
  const taken = allUsers().some(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
  )
  if (taken) throw new Error('An account with this email already exists.')

  const user = {
    name: name.trim(),
    email: email.trim(),
    password,
    role,
    ...(role === 'department' ? { department } : {}),
  }
  localStorage.setItem(USERS_KEY, JSON.stringify([...readStored(), user]))
  localStorage.setItem(SESSION_KEY, JSON.stringify(publicUser(user)))
  return publicUser(user)
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
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