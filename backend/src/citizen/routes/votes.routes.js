import { Router } from 'express'
import { validate } from '../../middlewares/validate.js'
import { idParams } from '../citizen.schemas.js'
import * as controller from '../controller/votes.controller.js'

const router = Router()

router.post('/reports/:id/vote', validate({ params: idParams }), controller.addVote)
router.delete('/reports/:id/vote', validate({ params: idParams }), controller.removeVote)

export default router