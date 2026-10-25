// Form checks shared by the citizen and staff sign-up pages.
// Returns a whole-sentence error, or null when the details look fine.
export function validateNewAccount({ email, password, confirm }) {
  return validateEmail(email) ?? validatePassword({ password, confirm })
}

// Returns a whole-sentence error, or null when the email looks fine.
export function validateEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email.trim()) ? null : 'Enter a valid email address.'
}

// The password rules for a new account, also used when a password is changed.
// Returns a whole-sentence error, or null. The password is never trimmed.
export function validatePassword({ password, confirm }) {
  if (password.length < 6) return 'Password must be at least 6 characters.'
  if (password !== confirm) return 'The two passwords do not match.'
  return null
}
