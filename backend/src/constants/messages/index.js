// One file per panel under constants/messages/, joined here, so two people
// never edit the same lines. Add your panel's file and one line below.
import { ADMIN_MESSAGES } from './admin.js'
import { ASSIST_MESSAGES } from './assist.js'
import { MESSAGES as CITIZEN_MESSAGES } from './citizen.js'
import { DEPARTMENT_MESSAGES } from './department.js'
import { EMAIL_CODE_MESSAGES } from './emailCode.js'
import { PROFILE_MESSAGES } from './profile.js'
import { TRANSLATE_MESSAGES } from './translate.js'

export const MSG = Object.freeze({
  ...ADMIN_MESSAGES,
  ...ASSIST_MESSAGES,
  ...CITIZEN_MESSAGES,
  ...DEPARTMENT_MESSAGES,
  ...EMAIL_CODE_MESSAGES,
  ...PROFILE_MESSAGES,
  ...TRANSLATE_MESSAGES,
})

export { COMMON } from './common.js'