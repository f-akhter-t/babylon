import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import routes from './routes.js'
import errorHandler from './middlewares/errorHandler.js'
import AppError from './utils/AppError.js'
import { COMMON } from './constants/messages/common.js'

const app = express()
app.disable('x-powered-by')
app.use(cors({ origin: env.clientOrigin }))
app.use(express.json({ limit: '8mb' }))

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'The server is running.', data: { status: 'up' } })
})
app.use('/api', routes)
app.use(() => {
  throw new AppError('not-found', 404, COMMON.notFound)
})
app.use(errorHandler)

export default app