import mongoose from 'mongoose'
import { EMAIL_CODE_LIMITS } from '../constants/limits.js'

// One active code per account and purpose ('reset' for forgot password, 'verify'
// for checking a staff email). Only a hash of the code is stored.
const emailCodeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  purpose: { type: String, enum: EMAIL_CODE_LIMITS.purposes, required: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, required: true },
  // The code stops working here, and Mongo deletes the row soon after.
  expiresAt: { type: Date, required: true },
})

emailCodeSchema.index({ userId: 1, purpose: 1 }, { unique: true })
emailCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.models.EmailCode ?? mongoose.model('EmailCode', emailCodeSchema)
