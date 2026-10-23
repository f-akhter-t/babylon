import { Router } from 'express'
import * as controller from '../controller/votes.controller.js'

const router = Router()

router.post('/reports/:id/vote', controller.addVote)
router.delete('/reports/:id/vote', controller.removeVote)

export default router