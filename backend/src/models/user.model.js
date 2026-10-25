import mongoose from 'mongoose'
import { ALL_ROLES } from '../constants/roles.js'
import { DIVISIONS } from '../constants/divisions.js'

// One account. The password is only ever stored as a bcrypt hash, and
// passwordHash must never appear in any response (use toUserJSON below).
//
// Division replaces Ward in the citizen profile. A citizen can only report
// inside their own division, and the server reads it from here, never from
// the request body.
//
// Staff fields (jobTitle, employeeId, photo, departmentVerified, onboarded) are
// filled by the staff routes in auth/ (/api/auth/staff/*).
//   photo   the staff member's own picture: a small (192 px) WebP data URL.
//   avatar  the citizen profile picture (kept as it was, D14).
//   employeeId is only ever set by the roster check, so a non-empty value
//   means "verified". An ID belongs to one account (partial unique index below).
//   departmentVerified is set only by the department-code check.
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ALL_ROLES, required: true, default: 'citizen', index: true },
    department: { type: String, default: null },

    // Citizen profile
    phone: { type: String, default: '' },
    phoneVerified: { type: Boolean, default: false },
    address: { type: String, default: '' },
    division: { type: String, enum: [...DIVISIONS, ''], default: '' },
    avatar: { type: String },

    // Staff profile
    jobTitle: { type: String, default: '' },
    employeeId: { type: String, default: '' },
    photo: { type: String, default: '' },
    departmentVerified: { type: Boolean, default: false },
    onboarded: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
)

// One Employee ID, one account. Empty IDs (everyone who has not verified one)
// are left out of the index, so they never clash with each other.
userSchema.index(
  { employeeId: 1 },
  { unique: true, partialFilterExpression: { employeeId: { $gt: '' } } },
)

// What the API may send back about a user. Never includes passwordHash.
export function toUserJSON(user) {
  const plain = typeof user.toObject === 'function' ? user.toObject() : user
  const { _id, passwordHash, ...rest } = plain
  void passwordHash
  return { id: String(_id), ...rest }
}

export default mongoose.models.User ?? mongoose.model('User', userSchema)
