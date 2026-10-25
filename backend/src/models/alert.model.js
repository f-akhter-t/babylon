import mongoose from 'mongoose'

// Every kind of notice a citizen can get. Add a kind here first, then use it.
export const ALERT_KINDS = [
  'filed',
  'level-up',
  'new-report',
  'in-progress',
  'fix-submitted',
  'fix-waiting',
  'fix-verified',
  'resolved',
  'sent-back',
  'identity-verified',
  'identity-rejected',
  'reopen',
]

const alertSchema = new mongoose.Schema({
  recipient: { type: String, required: true, lowercase: true, trim: true },
  kind: { type: String, enum: ALERT_KINDS, required: true },
  text: { type: String, required: true },
  link: { type: String, default: '' },
  issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', default: null },
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
})

// Newest first per account: used by the list and by the "keep 50" rule.
alertSchema.index({ recipient: 1, createdAt: -1 })
alertSchema.index({ issueId: 1 })

export default mongoose.model('Alert', alertSchema)
