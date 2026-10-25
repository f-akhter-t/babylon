// Sentences for email codes, shared by every feature that sends one (forgot
// password now, the staff email check later). The {name} parts are filled in by
// the service.
export const EMAIL_CODE_MESSAGES = Object.freeze({
  emailCodeOff: 'Email codes are not available right now.',
  // One sentence for a wrong code, an expired one and an unknown email, so the
  // answer never says whether an account exists.
  emailCodeWrong: 'That code is not right or has expired. Check it, or ask for a new one.',
  emailCodeLocked: 'Too many wrong codes. Ask for a new code to try again.',
  emailCodeWait: 'Please wait {seconds} seconds before asking for a new code.',
  emailCodeFailed: 'We could not send the email. Please try again in a moment.',

  // The email itself.
  mailSender: 'Babylon',
  resetMailSubject: 'Your Babylon password reset code',
  resetMailText: (code, minutes) =>
    `Your Babylon password reset code is ${code}.\n\nIt works for ${minutes} minutes. If you did not ask to reset your password, you can ignore this email and your password stays the same.`,
})
