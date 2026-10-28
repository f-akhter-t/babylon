export function success(res, message, data = null, status = 200) {
  return res.status(status).json({ success: true, message, data })
}