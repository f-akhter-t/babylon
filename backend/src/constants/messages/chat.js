// Sentences for the citizen help chat (F4). Keys start with "chat".
export const CHAT_MESSAGES = Object.freeze({
  chatReplied: 'Here is the answer.',
  chatMessageMissing: 'Write your question first.',
  chatMessageLong: (max) => `Your message must be ${max} characters or fewer.`,
  chatHistoryInvalid: 'The earlier messages are not in the right shape.',
  chatTooMany: 'You are asking the assistant too fast. Please wait a moment and try again.',
})
