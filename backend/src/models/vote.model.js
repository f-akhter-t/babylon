import mongoose from 'mongoose'

// One vote = one citizen on one issue. The pair is unique, so a second vote
// from the same person on the same issue is refused by the database itself.
const voteSchema = new mongoose.Schema({
  issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  userEmail: { type: String, required: true, lowercase: true, trim: true },
  createdAt: { type: Date, default: Date.now },
})

voteSchema.index({ issueId: 1, userEmail: 1 }, { unique: true })

export default mongoose.model('Vote', voteSchema)
