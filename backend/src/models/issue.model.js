import mongoose from 'mongoose'
import { CATEGORIES, STATUSES, PRIORITIES, VERIFICATIONS } from '../constants/limits.js'

// The single source of issue field names. Everyone reads and writes these
// fields, so a rename is a pull request plus a message in the group chat.
//
// NOT stored (worked out when an issue is sent out, in issues.service.js):
//   id, rank, department, votes, daysAgo, reportedOn, sentOn, distanceM.
// The department comes from the category (constants/departments.js).
// Votes are counted from the Vote rows.
//
// createdAt and updatedAt come from `timestamps: true`. The seed scripts insert
// with `timestamps: false` and set createdAt themselves, so keep both here.
const sentBackSchema = new mongoose.Schema(
  { reason: { type: String, default: '' }, on: { type: String, default: '' } },
  { _id: false },
)

const issueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true, index: true },
    description: { type: String, default: '', trim: true },

    status: { type: String, enum: STATUSES, default: 'open', index: true },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    verification: { type: String, enum: VERIFICATIONS, default: 'none', index: true },

    // Where
    location: { type: String, default: '' },
    ward: { type: String, default: '' },
    division: { type: String, default: '', index: true },
    lat: { type: Number },
    lng: { type: Number },

    // Who. reporterEmail is the link to the account; reporter is the name shown.
    reporter: { type: String, default: '' },
    reporterEmail: { type: String, lowercase: true, trim: true, index: true },

    // Photos (image data URLs or paths)
    beforeImg: { type: String },
    afterImg: { type: String },
    pendingAfterImg: { type: String },
    departmentNote: { type: String },

    // AI (F1, F2). severityScore is 0 to 1. imageEmbedding is the CLIP vector of
    // the photo for the duplicate check: hidden from every query unless a service
    // asks for it with .select('+imageEmbedding'), and never sent out.
    severityScore: { type: Number },
    imageEmbedding: { type: [Number], select: false },
    // Shown on the issue page: "A pothole here was marked resolved in August."
    seenBefore: { type: String },

    // Admin sends a fix back: the latest reason, and every reason in order.
    sentBack: { type: sentBackSchema, default: undefined },
    sentBackHistory: { type: [mongoose.Schema.Types.Mixed], default: undefined },

    // Lifecycle times. The *On fields are short display dates ("24 Sep").
    startedAt: { type: Date },
    startedOn: { type: String },
    submittedAt: { type: Date },
    submittedOn: { type: String },
    resolvedAt: { type: Date },
    resolvedOn: { type: String },
    fixedInDays: { type: Number },
    reopenedAt: { type: Date },
    reopenedFrom: { type: String },
    // A report filed against a resolved issue points back at it.
    reopenedOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
    editedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
)

export default mongoose.models.Issue ?? mongoose.model('Issue', issueSchema)
