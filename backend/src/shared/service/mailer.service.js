// Sends one email through Gmail with Nodemailer. The only place that talks to the
// mail server. The address and the app password come from backend/.env, never
// from a request, and nothing here logs them.
import { env } from '../../config/env.js'
import { MSG } from '../../constants/messages/index.js'

const TIMEOUT_MS = 10_000

// Nodemailer is loaded when the first email is sent, so 'dev' mode and the tests
// never need it.
async function createTransport() {
  const { default: nodemailer } = await import('nodemailer')
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: env.emailUser, pass: env.emailAppPassword },
    // A mail server that does not answer must not hold a request open.
    connectionTimeout: TIMEOUT_MS,
    greetingTimeout: TIMEOUT_MS,
    socketTimeout: TIMEOUT_MS,
  })
}

let transport

// getTransport is a parameter only so tests can use a fake.
export function createMailer({ getTransport = async () => (transport ??= await createTransport()) } = {}) {
  return {
    async sendMail({ to, subject, text }) {
      const mail = await getTransport()
      await mail.sendMail({ from: `"${MSG.mailSender}" <${env.emailUser}>`, to, subject, text })
    },
  }
}

export const { sendMail } = createMailer()
