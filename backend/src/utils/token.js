import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function signToken({ email, role, department = null, onboarded = true }) {
  return jwt.sign({ role, department, onboarded }, env.jwtSecret, {
    subject: email,
    expiresIn: env.jwtExpiresIn,
  })
}

export function verifyToken(token) {
  const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] })
  return {
    email: payload.sub,
    role: payload.role,
    department: payload.department ?? null,
    onboarded: payload.onboarded === true,
  }
}