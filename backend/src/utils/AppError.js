export default class AppError extends Error {
  constructor(code, status, message, field) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status
    this.field = field
  }
}