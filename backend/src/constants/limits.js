// Validation limits, shared by validate.js and the services.
// Each panel keeps its own block, so merges stay clean.

// --- shared ---
export const CATEGORIES = Object.freeze(['Roads', 'Waste', 'Water', 'Lighting', 'Bridges'])
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

// --- alerts (shared by citizen, department and admin) ---
export const ALERT_LIMITS = Object.freeze({
  // Newest alerts kept per account; older ones are deleted when a new one arrives.
  keepNewest: 50,
})

// --- AI: CLIP photo severity (F1) ---
export const CLIP_LIMITS = Object.freeze({
  model: 'Xenova/clip-vit-base-patch32',
  // 'q8' is the 8-bit version of the model: about a quarter of the size of the
  // full one (about 150 MB instead of 580 MB), with almost the same answers.
  dtype: 'q8',
  // The first call downloads and loads the model, so it is slow. Past this the
  // photo is simply not assessed ("AI skipped") and the report is still created.
  timeoutMs: 30000,
  // The priorities CLIP may choose, from least to most serious, each with the
  // sentence the photo is compared to. severityScore is 0 for medium, 0.5 for
  // high and 1 for urgent, weighted by how well the photo matches each sentence.
  // The priority comes from that score: the highest level whose minScore the score
  // reaches. (Measured with the small q8 model on the sample photos: a faded zebra
  // crossing 0.12, a streetlight 0.20, a sinkhole 0.29, a pothole 0.44, a cracked
  // footbridge railing 0.57. Picking the single best sentence put the pothole and
  // the sinkhole at medium, which was too low.)
  levels: Object.freeze([
    { priority: 'medium', weight: 0, minScore: 0, text: 'a photo of a small, minor problem on a street or in a public place' },
    { priority: 'high', weight: 0.5, minScore: 0.25, text: 'a photo of a large, serious problem that needs repair soon' },
    { priority: 'urgent', weight: 1, minScore: 0.55, text: 'a photo of a dangerous hazard that is an immediate risk to people' },
  ]),
})


// --- AI: translate report text (F10) ---
export const TRANSLATE_LIMITS = Object.freeze({
  // Report text is at most 500 characters, so this leaves room for a title too.
  maxChars: 1000,
  // The languages a user may translate into.
  languages: Object.freeze([
    { code: 'en', name: 'English' },
    { code: 'bn', name: 'Bangla' },
  ]),
  // Per signed-in user. Kept in the server's memory, so on a serverless host
  // each running copy counts for itself.
  rate: Object.freeze({ windowMs: 60 * 1000, max: 10 }),
  timeoutMs: 10000,
})
