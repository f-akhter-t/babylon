import mongoose from 'mongoose'
import { env } from './env.js'

// One connection, shared by every request. On a serverless host (Vercel) the
// code may start fresh for any request, and several requests can arrive at
// once, so the first caller starts connecting and everyone else waits for the
// same attempt. When the attempt ends (success or failure) it is forgotten: a
// later call checks the connection again, and after a failure it tries again.
let connecting = null

export function connectDb() {
  if (mongoose.connection.readyState === 1) return Promise.resolve()
  connecting ??= mongoose
    .connect(env.mongoUri, {
      maxPoolSize: 5, // a small pool: a free Atlas cluster allows few connections
      serverSelectionTimeoutMS: 5000, // fail fast instead of hanging for 30 seconds
    })
    .then(() => {
      console.log(`MongoDB connected: ${mongoose.connection.name}`)
    })
    .finally(() => {
      connecting = null // done (or failed): the next call checks the state again
    })
  return connecting
}
