// The test data for the admin panel, built from the clock so the figures are
// always "the last 8 weeks". Used by seed.admin.js and by the tests.
// Every row belongs to a fake account ending in @seed-admin.test, so a re-run
// removes exactly what it made before and touches nothing else.
export const SEED_DOMAIN = 'seed-admin.test'
export const seedEmail = (name) => `${name}@${SEED_DOMAIN}`

const DAY = 86400000
const HOUR = 3600000

// A 1x1 picture, standing in for a card photo or an after-photo.
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAHP6dZQAAAABJRU5ErkJggg=='
export const TINY_PNG = Buffer.from(PNG_BASE64, 'base64')
export const TINY_PNG_DATA_URL = `data:image/png;base64,${PNG_BASE64}`

const ago = (now, ms) => new Date(now.getTime() - ms)
const shortDate = (d) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(d)

export function buildSeed(now = new Date()) {
  const users = [
    { email: seedEmail('nadia'), name: 'Nadia Rahman' },
    { email: seedEmail('arif'), name: 'Arif Hossain' },
    { email: seedEmail('tania'), name: 'Tania Akter' },
    { email: seedEmail('imran'), name: 'Imran Chowdhury' },
    { email: seedEmail('sumi'), name: 'Sumi Das' },
  ].map((user) => ({ ...user, role: 'citizen', passwordHash: '!seed-no-login' }))

  // ---- Waiting for the admin: the department sent an after-photo ----
  const awaiting = [
    ['Overflowing bins at Lalkhan Bazar market', 'Waste', 2 * HOUR, 'Bins emptied and the area cleaned.'],
    ['Deep pothole near Wasa Circle', 'Roads', 26 * HOUR, 'Filled and levelled, checked by the supervisor.'],
    ['Streetlight out on Jamal Khan Road', 'Lighting', 3 * DAY, 'Lamp and wiring replaced.'],
  ].map(([title, category, waited, departmentNote], i) => ({
    title,
    category,
    description: `${title}. Reported by a citizen.`,
    status: 'in-progress',
    priority: 'high',
    verification: 'awaiting',
    location: 'Chattogram',
    ward: 'Ward 15',
    reporter: users[i].name,
    reporterEmail: users[i].email,
    beforeImg: '/images/reports/seed-before.jpg',
    pendingAfterImg: TINY_PNG_DATA_URL,
    departmentNote,
    createdAt: ago(now, 12 * DAY + i * DAY),
    startedAt: ago(now, 8 * DAY),
    submittedAt: ago(now, waited),
    submittedOn: shortDate(ago(now, waited)),
  }))

  // ---- Reopened: a closed problem came back ----
  const reopened = [
    {
      title: 'Potholes along Tiger Pass Road',
      category: 'Roads',
      description: 'The patch broke up again after the rain.',
      status: 'in-progress',
      priority: 'reopened',
      verification: 'reopened',
      location: 'Tiger Pass Road',
      ward: 'Ward 12',
      reporter: users[3].name,
      reporterEmail: users[3].email,
      beforeImg: '/images/reports/seed-before.jpg',
      afterImg: '/images/reports/seed-after.jpg',
      createdAt: ago(now, 18 * DAY),
      resolvedAt: ago(now, 6 * DAY),
      reopenedAt: ago(now, 1 * DAY),
    },
  ]

  // ---- History for the Accountability page: 40 issues over 8 weeks ----
  const categories = ['Roads', 'Waste', 'Water', 'Lighting', 'Bridges']
  const history = Array.from({ length: 40 }, (_, i) => {
    const createdAt = ago(now, i * 1.4 * DAY + 2 * HOUR)
    const resolved = i % 4 !== 0 && i > 2
    const days = 2 + (i % 8)
    const resolvedAt = new Date(Math.min(createdAt.getTime() + days * DAY, now.getTime() - HOUR))
    return {
      title: `Seed issue ${i + 1}`,
      category: categories[i % categories.length],
      description: 'Made-up report for the accountability figures.',
      status: resolved ? 'resolved' : i % 2 ? 'open' : 'in-progress',
      priority: resolved ? 'fix-verified' : 'medium',
      verification: resolved ? 'verified' : 'none',
      location: 'Chattogram',
      ward: 'Ward 1',
      reporter: users[i % users.length].name,
      reporterEmail: users[i % users.length].email,
      beforeImg: '/images/reports/seed-before.jpg',
      createdAt,
      ...(resolved ? { resolvedAt, resolvedOn: shortDate(resolvedAt) } : {}),
      ...(resolved && i % 9 === 0 ? { reopenedAt: new Date(resolvedAt.getTime() + HOUR) } : {}),
    }
  })

  // "Other" has no department: it must count nowhere.
  const other = [
    {
      title: 'Stray dogs near the school gate',
      category: 'Other',
      description: 'No department handles this category.',
      status: 'open',
      priority: 'medium',
      verification: 'none',
      location: 'Chattogram',
      ward: 'Ward 3',
      reporter: users[4].name,
      reporterEmail: users[4].email,
      beforeImg: '/images/reports/seed-before.jpg',
      createdAt: ago(now, 5 * DAY),
    },
  ]

  // ---- Identity submissions ----
  const identities = [
    { userEmail: users[0].email, status: 'pending', nidLast4: '4821', submittedAt: ago(now, 5 * DAY), photo: { data: TINY_PNG, contentType: 'image/png' } },
    { userEmail: users[1].email, status: 'pending', nidLast4: '7390', submittedAt: ago(now, 2 * DAY), photo: { data: TINY_PNG, contentType: 'image/png' } },
    { userEmail: users[2].email, status: 'pending', nidLast4: '1156', submittedAt: ago(now, 1 * HOUR), photo: { data: TINY_PNG, contentType: 'image/png' } },
    // Sent before photos were kept: it cannot be approved, only rejected.
    { userEmail: users[3].email, status: 'pending', nidLast4: '9034', submittedAt: ago(now, 3 * DAY) },
    // Already checked: not in the queue.
    { userEmail: users[4].email, status: 'verified', nidLast4: '2208', submittedAt: ago(now, 9 * DAY), reviewedAt: ago(now, 8 * DAY), reason: '' },
  ]

  return { users, issues: [...awaiting, ...reopened, ...history, ...other], identities }
}
