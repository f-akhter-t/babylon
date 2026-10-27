// Removes the demo rows made by the seed scripts (emails ending in .test).
//   npm run clean:seed             shows what would be removed, deletes nothing
//   npm run clean:seed -- --yes    removes them
// Real accounts and reports are not touched. Like the seeds, it refuses to run
// when NODE_ENV=production: for the live database, put the live MONGODB_URI in
// a temporary .env on a laptop, run it, then remove it.
import 'dotenv/config'
import mongoose from 'mongoose'
import User from '../src/models/user.model.js'
import Issue from '../src/models/issue.model.js'
import Vote from '../src/models/vote.model.js'
import Alert from '../src/models/alert.model.js'
import Identity from '../src/models/identity.model.js'
import EmailCode from '../src/models/emailCode.model.js'
import PhoneCode from '../src/models/phoneCode.model.js'
import { cleanSeed } from './cleanSeedData.js'

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run in production.')
  process.exit(1)
}

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('MONGODB_URI is missing. Add it to backend/.env (it is not committed).')
  process.exit(1)
}

const apply = process.argv.includes('--yes')

try {
  await mongoose.connect(uri)
  console.log(`Database "${mongoose.connection.name}".`)
  const counts = await cleanSeed(
    { User, Issue, Vote, Alert, Identity, EmailCode, PhoneCode },
    { apply },
  )
  console.log(apply ? 'Removed:' : 'Would remove (nothing deleted yet):')
  for (const [name, count] of Object.entries(counts)) console.log(`  ${name.padEnd(11)} ${count}`)
  if (!apply) console.log('Run again with --yes to remove them: npm run clean:seed -- --yes')
} finally {
  await mongoose.disconnect()
}
