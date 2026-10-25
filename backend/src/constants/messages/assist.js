// Sentences for the report assistant (F6) and the summary (F8). The "assistant
// is not available" sentence is shared with the other AI features (ai.js).
export const ASSIST_MESSAGES = Object.freeze({
  assisted: 'Here is a suggestion for your report.',
  summarized: 'Here is a short summary.',
  assistPhotoMissing: 'Add a photo first so the assistant can look at it.',
  assistPhotoInvalid: 'Please send the photo as an image (JPEG, PNG or WebP).',
  assistPhotoTooBig: 'That photo is too big. Please choose a smaller one.',
  assistCategoryInvalid: 'Please choose one of the 5 categories.',
  summarizeTextMissing: 'Write what is wrong first, then ask for a summary.',
  summarizeTextShort: (min) => `Write at least ${min} characters first, then ask for a summary.`,
  summarizeTextLong: (max) => `The text must be ${max} characters or fewer.`,
  assistTooMany: 'You are asking the assistant too fast. Please wait a moment and try again.',
})
