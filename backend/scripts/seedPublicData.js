// Test data for the public panel and the sign-in screens:
//   - the 12 sample issues the pages show today, with their votes
//   - the 3 demo accounts (citizen, department, admin), password "password123"
//
// buildPublicSeed() only builds plain objects, so it is easy to test.
// seedPublic() writes them with UPSERTS, so running it twice gives the same
// rows (3 accounts, 12 issues) and never deletes anyone else's data.
import { PUBLIC_SEED_ISSUES } from './seedPublicIssues.js'

export const DEMO_PASSWORD = 'password123'
export const SEED_DOMAIN = 'seed-public.test'

const DAY = 86400000
const ago = (now, days) => new Date(now.getTime() - days * DAY)
const shortDate = (d) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(d)

// A 1x1 picture, standing in for an after-photo waiting for the admin.
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAHP6dZQAAAABJRU5ErkJggg=='
export const TINY_PNG_DATA_URL = `data:image/png;base64,${PNG_BASE64}`

const emailFor = (reporter) => `${reporter.split(/[ .]/)[0].toLowerCase()}@${SEED_DOMAIN}`

export const DEMO_USERS = [
  { email: 'citizen@babylon.test', name: 'Nadia R.', role: 'citizen', department: null, division: 'Chattogram', onboarded: true },
  { email: 'roads@babylon.test', name: 'Rafiq Hasan', role: 'department', department: 'Roads & Highways', onboarded: true },
  { email: 'admin@babylon.test', name: 'Tahmina Akter', role: 'admin', department: null, onboarded: true },
]

export function buildPublicSeed(now = new Date()) {
  const issues = PUBLIC_SEED_ISSUES.map((source) => {
    const { votes, daysAgo, startedOn, submittedOn, reopenedFrom, fixedInDays, ...stored } = source
    const reporterEmail = stored.reporterEmail ?? emailFor(stored.reporter)
    const createdAt = ago(now, daysAgo)

    const doc = {
      ...stored,
      reporterEmail,
      division: 'Chattogram',
      createdAt,
    }
    // The dates are built from the clock, so "days ago" and the dates always agree.
    if (startedOn) {
      doc.startedAt = new Date(createdAt.getTime() + 1 * DAY)
      doc.startedOn = shortDate(doc.startedAt)
    }
    if (submittedOn) {
      doc.submittedAt = new Date(createdAt.getTime() + 3 * DAY)
      doc.submittedOn = shortDate(doc.submittedAt)
      doc.pendingAfterImg = TINY_PNG_DATA_URL // waiting for the admin
    }
    if (fixedInDays) {
      doc.resolvedAt = new Date(createdAt.getTime() + fixedInDays * DAY)
      doc.resolvedOn = shortDate(doc.resolvedAt)
      doc.fixedInDays = fixedInDays
    }
    if (reopenedFrom) {
      doc.reopenedFrom = shortDate(ago(now, daysAgo + 13))
      doc.reopenedAt = createdAt
    }

    // The reporter's own vote counts, then made-up neighbours up to the total.
    const voters = [reporterEmail]
    for (let n = 1; voters.length < votes; n += 1) voters.push(`voter${n}@${SEED_DOMAIN}`)
    return { doc, voters }
  })

  return { users: DEMO_USERS, issues }
}

// models: { User, Issue, Vote }. hashPassword: (text) => Promise<hash>.
export async function seedPublic({ User, Issue, Vote, hashPassword, now = new Date() }) {
  const { users, issues } = buildPublicSeed(now)

  const passwordHash = await hashPassword(DEMO_PASSWORD)
  for (const user of users) {
    await User.updateOne({ email: user.email }, { $set: { ...user, passwordHash } }, { upsert: true })
  }

  let votes = 0
  for (const { doc, voters } of issues) {
    // Same title and same reporter = the same issue, so a second run updates it.
    const saved = await Issue.findOneAndUpdate(
      { title: doc.title, reporterEmail: doc.reporterEmail },
      { $set: doc },
      { upsert: true, returnDocument: 'after', timestamps: false },
    ).lean()

    await Vote.bulkWrite(
      voters.map((userEmail) => ({
        updateOne: {
          filter: { issueId: saved._id, userEmail },
          update: { $setOnInsert: { issueId: saved._id, userEmail } },
          upsert: true,
        },
      })),
      { ordered: false },
    )
    votes += voters.length
  }
  return { users: users.length, issues: issues.length, votes }
}
