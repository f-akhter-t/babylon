// Checks the REAL CLIP model on your computer: does it load, how long does the
// first photo take, how much memory does it use, and what does it say.
//   1. npm install            (once, to get @huggingface/transformers)
//   2. node scripts/clip-check.mjs path/to/a/photo.jpg
// The first run downloads the model (about 150 MB) and keeps it in a cache, so
// the second run is faster. Post the numbers it prints in the team chat: the live
// app turns CLIP on only if it fits on Vercel (2 GB memory, 250 MB bundle).
// Not part of the app, and never run in production.
import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'

process.env.CLIP_ENABLED = 'true'
try {
  process.loadEnvFile('.env')
} catch {
  // no .env: only the variables below are needed
}
process.env.MONGODB_URI ??= 'mongodb://unused.test/db'
process.env.JWT_SECRET ??= 'only-for-this-check-123456'
process.env.CLIP_ENABLED = 'true'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/clip-check.mjs path/to/photo.jpg')
  process.exit(1)
}
const types = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }
const type = types[extname(file).toLowerCase()]
if (!type) {
  console.error('Use a .jpg, .png or .webp photo.')
  process.exit(1)
}
const dataUrl = `data:${type};base64,${(await readFile(file)).toString('base64')}`

const { assessPhoto } = await import('../src/shared/service/severity.service.js')
const mb = (bytes) => Math.round(bytes / 1024 / 1024)

console.log('Step 1: loading the model. The first run downloads about 150 MB, so wait (no time limit here)...')
let started = Date.now()
const { clip } = await import('../src/shared/service/clip.service.js')
try {
  await clip.embedImage(dataUrl)
  await clip.embedTexts(['warm up'])
} catch (err) {
  console.error('The model could not load:', err.message)
  process.exit(1)
}
const loadMs = Date.now() - started
console.log(`Model ready in ${(loadMs / 1000).toFixed(1)} s. Step 2: assessing the photo...`)
started = Date.now()
const first = await assessPhoto(dataUrl)
const coldMs = Date.now() - started
if (!first) {
  console.error('CLIP answered null: it failed or timed out. Read the message above.')
  process.exit(1)
}
started = Date.now()
await assessPhoto(dataUrl)
const warmMs = Date.now() - started

console.log('')
console.log(`priority:        ${first.priority}`)
console.log(`severityScore:   ${first.severityScore}`)
console.log(`embedding:       ${first.embedding.length} numbers`)
console.log(`model load:      ${(loadMs / 1000).toFixed(1)} s (a live cold start pays this)`)
console.log(`first photo:     ${(coldMs / 1000).toFixed(1)} s`)
console.log(`next photo:      ${(warmMs / 1000).toFixed(1)} s`)
console.log(`memory (RSS):    ${mb(process.memoryUsage().rss)} MB`)
process.exit(0)
