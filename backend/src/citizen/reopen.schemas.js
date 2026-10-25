import { z } from 'zod'
import { MSG } from '../constants/messages/index.js'

// POST /api/citizen/reports/:id/reopen has no body: the id is the only input.
export const reopenParams = z.object({ id: z.string().min(1, { error: MSG.reopenGone }) })
