// Decides how email codes work, from the raw settings. Kept apart from env.js
// (which reads the environment and stops the server) so it can be tested.
//
//   EMAIL_MODE=dev   a fixed code, nothing is sent. For local work and Postman.
//   EMAIL_MODE=smtp  a random code, sent through Gmail (EMAIL_USER + EMAIL_APP_PASSWORD).
//   anything else    email codes are off and the routes answer 500.
//
// A fixed code on a live site would let anyone reset any account's password, so
// 'dev' is refused when NODE_ENV=production.
export function pickEmailMode({ mode, user, password, isProduction }) {
  if (mode === 'dev') {
    if (isProduction) {
      return {
        mode: 'off',
        problem: 'EMAIL_MODE=dev is not allowed when NODE_ENV=production (the code is fixed). Email codes are off.',
      }
    }
    return { mode: 'dev' }
  }
  if (mode === 'smtp') {
    if (!user || !password) {
      return {
        mode: 'off',
        problem: 'EMAIL_MODE=smtp needs EMAIL_USER and EMAIL_APP_PASSWORD in backend/.env. Email codes are off.',
      }
    }
    return { mode: 'smtp' }
  }
  return { mode: 'off' }
}
