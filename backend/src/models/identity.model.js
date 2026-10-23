import mongoose from 'mongoose'

// One identity submission by a citizen. The full NID number is NEVER stored:
// only the last 4 digits and the status. The card photo lives here until an
// admin reviews it, then it is deleted in the same database write as the
// decision. The photo is not returned by a normal query (select: false).
//
// Contract for whoever writes the citizen "submit identity" endpoint:
//   create { userEmail (lower case), status: 'pending', nidLast4, submittedAt,
//            photo: { data: Buffer, contentType } }
//   and refuse a second submission while one is 'pending' or 'verified'.
const photoSchema = new mongoose.Schema(
  { data: { type: Buffer, required: true }, contentType: { type: String, required: true } },
  { _id: false },
)

const identitySchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending', index: true },
    nidLast4: { type: String, required: true, match: /^\d{4}$/ },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reason: { type: String, default: '' },
    photo: { type: photoSchema, select: false },
  },
  { versionKey: false },
)

export default mongoose.models.Identity ?? mongoose.model('Identity', identitySchema)
