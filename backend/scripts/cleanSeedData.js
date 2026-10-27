// Removes the seeded demo rows and nothing else, so real accounts and reports
// in the same database stay.
//
// Every seeded account, report, vote and notice belongs to an email address that
// ends in ".test" (citizen@babylon.test, nadia@seed-admin.test ...), and real
// sign-ups cannot use one. cleanSeed() finds those rows, counts them, and
// deletes them only when apply is true.
//
// The models are passed in, so the tests can use a small in-memory stand-in.
export const SEED_EMAIL = /\.test$/i

export async function cleanSeed(models, { apply = false } = {}) {
  const { User, Issue, Vote, Alert, Identity, EmailCode, PhoneCode } = models

  const users = await User.find({ email: SEED_EMAIL }).select('_id').lean()
  const issues = await Issue.find({ reporterEmail: SEED_EMAIL }).select('_id').lean()
  const userId = { $in: users.map((user) => user._id) }
  const issueId = { $in: issues.map((issue) => issue._id) }

  // Children first, so nothing is left pointing at a row that is gone.
  const steps = [
    ['votes', Vote, { $or: [{ issueId }, { userEmail: SEED_EMAIL }] }],
    ['alerts', Alert, { $or: [{ issueId }, { recipient: SEED_EMAIL }] }],
    ['identities', Identity, { userEmail: SEED_EMAIL }],
    ['emailCodes', EmailCode, { $or: [{ userId }, { email: SEED_EMAIL }] }],
    ['phoneCodes', PhoneCode, { userId }],
    ['issues', Issue, { reporterEmail: SEED_EMAIL }],
    ['users', User, { email: SEED_EMAIL }],
  ]

  const counts = {}
  for (const [name, Model, filter] of steps) {
    counts[name] = await Model.countDocuments(filter)
    if (apply && counts[name] > 0) await Model.deleteMany(filter)
  }
  return counts
}
