// Mock login. Accounts live in the browser (localStorage) until the backend exists.
// Later, each function becomes a fetch() call to Express and pages will not change.

const USERS_KEY = 'babylon-users'
const SESSION_KEY = 'babylon-session'

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

function publicUser({ password, ...user }) {
  void password
  return user
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