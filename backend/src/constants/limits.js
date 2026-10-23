// Validation limits, shared by validate.js and the services.
// Each panel keeps its own block, so merges stay clean.

// --- shared ---
export const CATEGORIES = Object.freeze(['Roads', 'Waste', 'Water', 'Lighting', 'Bridges', 'Other'])
export const STATUSES = Object.freeze(['open', 'in-progress', 'resolved'])
export const PRIORITIES = Object.freeze(['urgent', 'high', 'reopened', 'medium', 'fix-verified'])
export const VERIFICATIONS = Object.freeze(['none', 'awaiting', 'reopened', 'verified'])

// --- admin ---
export const ADMIN_LIMITS = Object.freeze({
  // Why a fix is sent back to the department.
  fixRejectReasonMax: 500,
  // Why an identity is not approved. The citizen reads it.
  identityRejectReason: { min: 5, max: 200 },
  // "Waiting longest" list on the Accountability page.
  waitingLongest: 4,
  // Card photo of an identity submission.
  idPhotoMaxBytes: 5 * 1024 * 1024,
})
