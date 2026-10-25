// Sentences for "this fixed problem came back" (citizen reopen). Keys start with
// "reopen" so they never clash with other panels.
export const REOPEN_MESSAGES = Object.freeze({
  reopenDone: 'The report was reopened and sent to the admin.',
  reopenGone: 'We could not find that report.',
  reopenNotResolved: 'Only a resolved report can be reopened.',
  reopenAlready: 'This report was already reopened. It is waiting for the admin.',
  reopenForAdmin: (title) => `A fixed problem came back: ${title}.`,
  reopenForReporter: (title) => `Your report "${title}" was reopened because the problem came back.`,
})
