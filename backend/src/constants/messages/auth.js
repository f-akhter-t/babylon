// Sentences copied from the frontend, so the screens say the same thing.
// Imported directly by the auth panel (not through messages/index.js).
export const AUTH_MESSAGES = Object.freeze({
  signedUp: 'Your account is ready.',
  loggedIn: 'You are logged in.',
  loggedOut: 'You are logged out.',
  me: 'Here is your account.',
  passwordChanged: 'Your password is changed.',

  // Same sentence for an unknown email and a wrong password, on purpose.
  badLogin: 'That email and password do not match an account.',
  staffAccount: 'This is a staff account, so please use the staff sign-in page.',
  citizenAccount: 'This is a citizen account, so please use the citizen log-in page.',
  emailTaken: 'An account with this email already exists.',
  staffSignupClosed: 'Staff accounts are not created on this page. Ask your administrator.',

  nameInvalid: 'Enter your name (2 to 50 letters, spaces, dots, hyphens or apostrophes).',
  emailInvalid: 'Enter a valid email address.',
  emailRequired: 'Enter your email address.',
  passwordShort: 'Password must be at least 6 characters.',
  passwordLong: 'Password must be 72 characters or fewer.',
  passwordRequired: 'Enter your password.',
  doorInvalid: 'Choose the citizen or the staff sign-in page.',

  currentRequired: 'Enter your current password.',
  currentWrong: 'Your current password is not correct.',
  newRequired: 'Enter a new password.',
  newSame: 'Your new password must be different from your current password.',
})
