// backend/scripts/backfill-embeddings.js
// F2 needs an imageEmbedding on every issue. Seed issues have none, and their
// photos are served by the frontend (frontend/public/images). This reads each
// photo, asks CLIP for its embedding, and stores it. Issues that already have
// one are skipped. Needs CLIP_ENABLED=true and a full checkout. Run from backend/.
import fs from 'node:fs/promises'
import path from 'node:path'
import mongoose from 'mongoose'

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run in production.')
  process.exit(1)
}
try {
  process.loadEnvFile('.env') // reads backend/.env
} catch {
  // no .env file: rely on real environment variables
}
if (process.env.CLIP_ENABLED !== 'true') {
  console.error('CLIP_ENABLED is not true. Set it in backend/.env and run again.')
  process.exit(1)
}

// Loaded after the .env is read, because env.js reads the variables on import.
const { default: Issue } = await import('../src/models/issue.model.js')
const { assessPhoto } = await import('../src/shared/service/severity.service.js')

const IMAGES_ROOT = path.resolve('..', 'frontend', 'public')
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }

async function toDataUrl(photo) {
  if (photo.startsWith('data:image/')) return photo
  const file = path.join(IMAGES_ROOT, photo)
  if (!file.startsWith(IMAGES_ROOT)) return null
  const mime = MIME[path.extname(file).toLowerCase()]
  if (!mime) return null
  try {
    return `data:${mime};base64,${(await fs.readFile(file)).toString('base64')}`
  } catch {
    return null
  }
}

await mongoose.connect(process.env.MONGODB_URI)
console.log('Backfilling database:', mongoose.connection.name)

const issues = await Issue.find({ beforeImg: { $exists: true, $ne: '' } })
  .select('+imageEmbedding beforeImg')
  .lean()

const cache = new Map() // the same photo file gives the same embedding
let done = 0
let skipped = 0
let failed = 0

for (const issue of issues) {
  if (issue.imageEmbedding?.length) {
    skipped += 1
    continue
  }
  let embedding = cache.get(issue.beforeImg)
  if (!embedding) {
    const dataUrl = await toDataUrl(issue.beforeImg)
    const result = dataUrl ? await assessPhoto(dataUrl) : null
    embedding = result?.embedding
    if (embedding) cache.set(issue.beforeImg, embedding)
  }
  if (!embedding) {
    failed += 1
    console.warn('No embedding for', issue._id.toString(), issue.beforeImg)
    continue
  }
  await Issue.updateOne({ _id: issue._id }, { $set: { imageEmbedding: embedding } }, { timestamps: false })
  done += 1
}

console.log(`Done: ${done} stored, ${skipped} already had one, ${failed} failed.`)
await mongoose.disconnect()
process.exit(failed > 0 && done === 0 ? 1 : 0)