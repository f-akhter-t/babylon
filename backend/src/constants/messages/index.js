// One file per panel under constants/messages/, joined here, so two people
// never edit the same lines. Add your panel's file and one line below.
import { ADMIN_MESSAGES } from './admin.js'
import { MESSAGES as CITIZEN_MESSAGES } from './citizen.js'

export const MSG = Object.freeze({
  ...ADMIN_MESSAGES,
  ...CITIZEN_MESSAGES,
})
export { COMMON } from './common.js'