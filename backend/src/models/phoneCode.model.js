import mongoose from 'mongoose'

// One active code per account + phone number.
const phoneCodeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phone: { type: String, required: true, trim: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, required: true },
  // The code stops working here, and Mongo deletes the row soon after.
  expiresAt: { type: Date, required: true },
})

phoneCodeSchema.index({ userId: 1, phone: 1 }, { unique: true })
phoneCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('PhoneCode', phoneCodeSchema)