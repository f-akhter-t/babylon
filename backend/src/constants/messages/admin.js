// --- admin --- every sentence an admin endpoint sends. Written once.
import { ADMIN_LIMITS } from '../limits.js'

const { min, max } = ADMIN_LIMITS.identityRejectReason

export const ADMIN_MESSAGES = Object.freeze({
  // success
  queueLoaded: 'Verification queue loaded.',
  reopenedLoaded: 'Reopened issues loaded.',
  countsLoaded: 'Admin counts loaded.',
  approved: 'The fix was verified and the issue is closed.',
  rejected: 'The fix was sent back to the department.',
  sentToQueue: 'The reopened issue is now in the verification queue.',
  accountabilityLoaded: 'Accountability figures loaded.',
  identityQueueLoaded: 'Identity queue loaded.',
  identityCountLoaded: 'Identity count loaded.',
  identityApproved: 'The identity is verified.',
  identityRejected: 'The identity was not approved, and the citizen will see the reason.',
  adminAlertsListed: 'Your notices.',
  adminAlertsUnreadCount: 'Unread notices counted.',
  adminAlertMarkedRead: 'Notice marked as read.',
  adminAlertsAllRead: 'All notices marked as read.',

  // errors (same sentences as the frontend)
  issueGone: 'This issue no longer exists.',
  alreadyChecked: 'This issue was already checked by another admin.',
  rejectReasonNeeded: 'Write a reason before sending this back.',
  rejectReasonTooLong: `The reason can be at most ${ADMIN_LIMITS.fixRejectReasonMax} characters.`,
  notReopened: 'This issue is no longer reopened.',
  periodUnavailable: 'This period is not available.',
  submissionGone: 'This submission no longer exists.',
  alreadyReviewed: 'This submission was already reviewed.',
  noPhotoToApprove:
    'No card photo was saved with this submission, so it cannot be approved. Reject it and ask the citizen to send it again.',
  photoGone: 'The card photo is no longer available.',
  chooseDecision: 'Choose approve or reject.',
  identityReasonNeeded: 'Please write a reason for the citizen.',
  identityReasonShort: `The reason needs at least ${min} characters.`,
  identityReasonLong: `The reason can be at most ${max} characters.`,

  // notices (each one whole sentence, as the frontend sends them)
  resolvedForReporter: (title) => `Your report "${title}" is resolved and verified.`,
  fixVerifiedForDepartment: (title) => `The admin verified your fix for "${title}".`,
  sentBackForReporter: (title, why) =>
    `The department's fix for "${title}" was sent back. Reason: ${why}`,
  sentBackForDepartment: (title, why) =>
    `The admin sent back your fix for "${title}". Reason: ${why}`,
  identityVerifiedForCitizen: 'Your identity is verified.',
  identityRejectedForCitizen: (why) => `Your identity was not approved. Reason: ${why}`,
})
