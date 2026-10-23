// One file per panel under constants/messages/, joined here, so two people
// never edit the same lines. Add your panel's file and one line below.
import { ADMIN_MESSAGES } from './admin.js'
import { DEPARTMENT_MESSAGES } from './department.js'
import { PROFILE_MESSAGES } from './profile.js'

export const MSG = Object.freeze({
  ...ADMIN_MESSAGES,
  ...DEPARTMENT_MESSAGES,
  ...PROFILE_MESSAGES,
})

export { COMMON } from './common.js'