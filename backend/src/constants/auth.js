// Rules for accounts and passwords. Same numbers as the frontend sign-up form.
export const AUTH_LIMITS = Object.freeze({
  // At least 6, never trimmed. bcrypt only reads the first 72 bytes, so a
  // longer password would be silently cut: refuse it instead.
  passwordMin: 6,
  passwordMax: 72,
  nameMin: 2,
  nameMax: 50,
  emailMax: 254,
})

// Letters in any script (and their accents), spaces, dots, hyphens, apostrophes.
export const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u

// The two sign-in pages: /login is the citizen door, /staff/login the staff door.
export const DOORS = Object.freeze(['citizen', 'staff'])

// Cost 10, as agreed in the backend plan.
export const BCRYPT_COST = 10
