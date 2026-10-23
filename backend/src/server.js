import app from './app.js'
import { env } from './config/env.js'
import { connectDb } from './config/db.js'

try {
  await connectDb()
  app.listen(env.port, () => console.log(`Babylon API on http://localhost:${env.port}`))
} catch (err) {
  console.error('Could not start the server:', err.message)
  process.exit(1)
}