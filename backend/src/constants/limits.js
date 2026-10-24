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


// --- citizen ---
export const CITIZEN_LIMITS = Object.freeze({
  title: { min: 5, max: 70 },
  description: { min: 10, max: 500 },
})

// --- phone code (shared by citizen profile and staff onboarding) ---
export const PHONE_CODE_LIMITS = Object.freeze({
  devCode: '123456', // used only when PHONE_CODE_MODE=dev
  resendSeconds: 30,
  maxAttempts: 3,
  lifeMinutes: 10,
})