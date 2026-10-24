import 'dotenv/config'

const required = ['MONGODB_URI', 'JWT_SECRET']
const missing = required.filter((name) => !process.env[name])
if (missing.length > 0) {
  console.error(`Missing in backend/.env: ${missing.join(', ')}`)
  process.exit(1)
}
if (process.env.JWT_SECRET.length < 16) {
  console.error('JWT_SECRET is too short. Use at least 16 characters.')
  process.exit(1)
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production',
  // CLIP photo severity (F1). Off by default: a host that cannot hold the model
  // leaves it off, and reports are created without an AI priority.
  clipEnabled: process.env.CLIP_ENABLED === 'true',
}