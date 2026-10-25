// Sentences copied from the frontend, so the screens say the same thing.
// Imported directly by the auth panel (not through messages/index.js).
export const AUTH_MESSAGES = Object.freeze({
  signedUp: 'Your account is ready.',
  loggedIn: 'You are logged in.',
  loggedOut: 'You are logged out.',
  me: 'Here is your account.',
  passwordChanged: 'Your password is changed.',
  forgotSent: 'If an account with that email exists, we have sent it a code.',
  passwordReset: 'Your password is changed. Please log in with it.',

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

  // ---- Staff accounts (/api/auth/staff/*). Wording copied from the frontend. ----
  staffRoleInvalid: 'Choose Department or Admin.',
  staffDepartmentInvalid: 'Choose your department.',
  accessCodeRequired: 'Enter the staff access code.',
  accessCodeWrong: 'That access code is not correct. Ask your administrator.',
  staffSignedUp: 'Your staff account is ready. Finish your profile to start.',
  staffOnly: 'Only staff accounts can do that.',
  departmentOnly: 'Only department accounts have a department code.',
  departmentCodeRequired: 'Enter your department code.',
  departmentCodeWrong: (department) =>
    `That code does not match the ${department} department. Ask your department head for the code.`,
  departmentCodeOk: 'Your department is verified.',
  employeeIdRequired: 'Enter your Employee ID.',
  employeeIdNotOnAdminList:
    'That Employee ID is not on the admin staff list. Check the ID, or ask the person who issued it.',
  employeeIdNotOnList: (department) =>
    `That Employee ID is not on the ${department} staff list. Check it with your department head.`,
  employeeIdTaken:
    'That Employee ID is already linked to another account. Check the ID, or ask the person who issued it.',
  employeeIdLocked: 'Your Employee ID is already verified and cannot be changed.',
  employeeIdOk: 'Your Employee ID is verified.',
  jobTitleInvalid: (min, max) => `Your job title needs ${min} to ${max} characters.`,
  detailsNothing: 'Send at least one thing to change: name or job title.',
  detailsSaved: 'Your details are saved.',
  photoInvalid: 'Please send the photo as an image (WebP, PNG or JPEG data URL).',
  photoTooBig: 'That photo is too big. Please choose a smaller one.',
  photoSaved: 'Your photo is saved.',
  photoRemoved: 'Your photo is removed.',
  phoneInvalid: 'Enter an 11-digit mobile number that starts with 013 to 019.',
  phoneRequired: 'Please enter a valid mobile number first.',
  codeRequired: 'Enter the 6-digit code.',
  staffMe: 'Here is your staff profile.',
  setupIncomplete: 'Your profile is not complete yet. Please finish every step first.',
  setupDone: 'Your profile is set up.',
  tooManyAttempts: 'Too many tries. Please wait a moment and try again.',
})
