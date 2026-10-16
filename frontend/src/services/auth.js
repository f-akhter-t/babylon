// Mock login. Accounts live in the browser (localStorage) until the backend exists.
// Later, each function becomes a fetch() call to Express and pages will not change.

const USERS_KEY = 'babylon-users'
const SESSION_KEY = 'babylon-session'
const NAMES_KEY = 'babylon-names' // names changed on the Profile page, by email

// Roles that sign up through the staff pages (/staff/login, /staff/signup).
// Citizens use /login and /signup.
export const STAFF_ROLES = [
  { id: 'department', label: 'Department' },
  { id: 'admin', label: 'Admin' },
]

// Mock only: a real backend would issue a personal invitation to each staff
// member instead of one shared code, and would never ship the code to the
// browser. It is only compared inside signup() and never saved.
const STAFF_ACCESS_CODE = 'BABYLON-STAFF-2026'
export const DEMO_STAFF_CODE = STAFF_ACCESS_CODE

const isStaffRole = (role) => role !== 'citizen'

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

// Thrown when an account signs in through the other door. `code` lets the
// page show a link to the right sign-in page next to the message.
function wrongDoor(message, code) {
  const error = new Error(message)
  error.code = code
  return error
}

// door: 'citizen' (/login) or 'staff' (/staff/login). Each door accepts only
// its own accounts. The account type is revealed only after the right password.
export async function login({ email, password, door }) {
  const user = allUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  if (!user || user.password !== password) {
    throw new Error('That email and password do not match an account.')
  }
  if (door === 'citizen' && isStaffRole(user.role)) {
    throw wrongDoor('This is a staff account, so please use the staff sign-in page.', 'staff-account')
  }
  if (door === 'staff' && !isStaffRole(user.role)) {
    throw wrongDoor('This is a citizen account, so please use the citizen log-in page.', 'citizen-account')
  }
  const session = publicUser(user)
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export async function signup({ name, email, password, role, department, accessCode }) {
  if (role !== 'citizen' && !STAFF_ROLES.some((r) => r.id === role)) {
    throw new Error('Choose a valid account type.')
  }
  if (isStaffRole(role) && accessCode?.trim() !== STAFF_ACCESS_CODE) {
    throw new Error('The staff access code is not correct. Ask your administrator for the code.')
  }
  if (role === 'department' && !department) {
    throw new Error('Choose the department you work for.')
  }

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