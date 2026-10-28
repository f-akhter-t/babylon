import AppError from '../utils/AppError.js'

// validate({ params?, query?, body? }) with Zod schemas.
// A failed check throws AppError('invalid', 400, message, field).
// The checked values go on req.valid (req.query cannot be reassigned in Express 5),
// and controllers read from there.
export function validate(schemas) {
  return (req, res, next) => {
    const valid = {}
    for (const part of ['params', 'query', 'body']) {
      if (!schemas[part]) continue
      const result = schemas[part].safeParse(req[part] ?? {})
      if (!result.success) {
        const issue = result.error.issues[0]
        throw new AppError('invalid', 400, issue.message, issue.path[0] ? String(issue.path[0]) : undefined)
      }
      valid[part] = result.data
    }
    req.valid = valid
    next()
  }
}

export default validate
